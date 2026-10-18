import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { db } from '../db/db';
import type { Task, Subtask } from '../types';
import { WeekCalendar } from '../components/calendar/WeekCalendar';
import { getTodayEpochDay, formatHeaderDate } from '../utils/dateUtils';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Modal } from '../components/ui/Modal';
import { TaskItem } from '../components/tasks/TaskItem';
import { TaskEditModal } from '../components/tasks/TaskEditModal';
import { RescheduleModal } from '../components/tasks/RescheduleModal';

export const TodayScreen: React.FC = () => {
  const [selectedEpochDay, setSelectedEpochDay] = useState<number>(getTodayEpochDay());
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToReschedule, setTaskToReschedule] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Высокопроизводительный батч-запрос (устраняет проблему N+1)
  const tasksWithSubtasks = useLiveQuery(async () => {
    const list = await db.tasks.where('dateEpochDay').equals(selectedEpochDay).sortBy('id');
    if (list.length === 0) return [];

    const taskIds = list.map(t => t.id as number);
    const allSubtasks = await db.subtasks.where('taskId').anyOf(taskIds).toArray();

    const subMap = new Map<number, Subtask[]>();
    allSubtasks.forEach(s => {
      if (!subMap.has(s.taskId)) subMap.set(s.taskId, []);
      subMap.get(s.taskId)!.push(s);
    });

    return list.map(t => ({
      ...t,
      subtasks: (subMap.get(t.id!) || []).sort((a, b) => (a.id || 0) - (b.id || 0))
    }));
  }, [selectedEpochDay]);

  const tasks = tasksWithSubtasks || [];

  const totalItems = tasks.reduce((acc, t) => acc + (t.subtasks && t.subtasks.length > 0 ? t.subtasks.length : 1), 0);
  const completedItems = tasks.reduce((acc, t) => {
    if (t.subtasks && t.subtasks.length > 0) {
      return acc + t.subtasks.filter((s: Subtask) => s.isCompleted).length;
    }
    return acc + (t.isCompleted ? 1 : 0);
  }, 0);
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleToggleTask = async (task: Task) => {
    if (!task.id) return;
    const nextStatus = !task.isCompleted;
    await db.tasks.update(task.id, { isCompleted: nextStatus });
    if (task.subtasks) {
      for (const s of task.subtasks) {
        if (s.id) await db.subtasks.update(s.id, { isCompleted: nextStatus });
      }
    }
  };

  const handleToggleSubtask = async (task: Task, subtask: Subtask) => {
    if (!subtask.id || !task.id) return;
    const nextStatus = !subtask.isCompleted;
    await db.subtasks.update(subtask.id, { isCompleted: nextStatus });
    const allSubtasks = await db.subtasks.where('taskId').equals(task.id).toArray();
    const updated = allSubtasks.map((s) => (s.id === subtask.id ? { ...s, isCompleted: nextStatus } : s));
    const allDone = updated.length > 0 && updated.every((s) => s.isCompleted);
    if (task.isCompleted !== allDone) {
      await db.tasks.update(task.id, { isCompleted: allDone });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    await db.transaction('rw', db.tasks, db.subtasks, async () => {
      await db.subtasks.where('taskId').equals(taskId).delete();
      await db.tasks.delete(taskId);
    });
    setTaskToDelete(null);
  };

  const handleReschedule = async (task: Task, newEpochDay: number) => {
    if (!task.id) return;
    await db.tasks.update(task.id, { dateEpochDay: newEpochDay });
    setTaskToReschedule(null);
  };

  return (
      <div className="flex flex-col w-full text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-24 lg:pb-8">

          {/* ЛЕВАЯ КОЛОНКА */}
          <div className="flex flex-col gap-5 lg:col-span-4 lg:sticky lg:top-0 item-reveal delay-100">
            <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 flex flex-col gap-6 shadow-lg transition-colors hover:border-white/10">
              <WeekCalendar
                  selectedEpochDay={selectedEpochDay}
                  onSelectDate={setSelectedEpochDay}
                  weekOffset={weekOffset}
                  onWeekOffsetChange={setWeekOffset}
              />
              <div className="flex flex-col gap-3 pt-5 border-t border-border-dark">
                <div className="flex justify-between items-center text-[13px] font-medium">
                  <span className="text-text-secondary-dark">Прогресс дня</span>
                  <span className="font-bold text-text-primary-dark"><AnimatedNumber value={progressPercent} />%</span>
                </div>
                <div className="w-full bg-item-dark h-1.5 rounded-full overflow-hidden">
                  <div className="bg-text-primary-dark h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>

            <button
                type="button"
                onClick={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
                className="hidden lg:flex w-full h-14 bg-text-primary-dark hover:opacity-90 text-bg-dark font-bold text-[15px] rounded-[16px] shadow-sm items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            >
              <Plus size={20} />
              <span>Новая задача</span>
            </button>
          </div>

          {/* ПРАВАЯ КОЛОНКА */}
          <div className="flex flex-col gap-4 lg:col-span-8 item-reveal delay-200">
            <div className="flex justify-between items-end px-1 border-b border-border-dark pb-4">
              <h2 className="text-xl font-bold text-text-primary-dark tracking-tight">{formatHeaderDate(selectedEpochDay)}</h2>
              <span className="text-[12px] font-mono text-text-secondary-dark px-2 py-1 rounded bg-item-dark border border-border-dark">
              {completedItems}/{totalItems}
            </span>
            </div>

            {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-text-secondary-dark text-[14px] bg-card-dark border border-border-dark rounded-[20px] border-dashed shadow-sm">
                  Задач нет. Отличный повод отдохнуть.
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {tasks.map((task) => (
                      <TaskItem
                          key={task.id}
                          task={task}
                          onToggle={() => handleToggleTask(task)}
                          onToggleSubtask={(s) => handleToggleSubtask(task, s)}
                          onEdit={() => { setTaskToEdit(task); setIsTaskModalOpen(true); }}
                          onReschedule={() => setTaskToReschedule(task)}
                          onDelete={() => setTaskToDelete(task)}
                      />
                  ))}
                </div>
            )}
          </div>
        </div>

        <div className="lg:hidden fixed bottom-6 mt-4 flex justify-center z-30 pointer-events-none left-0 right-0 item-reveal delay-300">
          <div className="w-full px-4 pointer-events-auto flex justify-end max-w-md">
            <button
                type="button"
                onClick={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
                className="w-14 h-14 bg-text-primary-dark text-bg-dark rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-95 border border-border-dark"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        <Modal isOpen={isTaskModalOpen} onClose={() => { setIsTaskModalOpen(false); setTaskToEdit(null); }}>
          {isTaskModalOpen && <TaskEditModal initialTask={taskToEdit} currentEpochDay={selectedEpochDay} onClose={() => { setIsTaskModalOpen(false); setTaskToEdit(null); }} />}
        </Modal>

        <Modal isOpen={!!taskToReschedule} onClose={() => setTaskToReschedule(null)}>
          {taskToReschedule && <RescheduleModal task={taskToReschedule} onClose={() => setTaskToReschedule(null)} onConfirm={(newEpoch) => handleReschedule(taskToReschedule, newEpoch)} />}
        </Modal>

        <Modal isOpen={!!taskToDelete} onClose={() => setTaskToDelete(null)} onEnter={() => taskToDelete?.id && handleDeleteTask(taskToDelete.id)}>
          {taskToDelete && (
              <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 w-full max-w-sm flex flex-col gap-5 shadow-2xl">
                <div className="flex flex-col gap-2">
                  <h3 className="text-[18px] font-bold text-text-primary-dark">Удалить задачу?</h3>
                  <p className="text-[14px] text-text-secondary-dark leading-relaxed">
                    Задача <span className="text-text-primary-dark font-medium">«{taskToDelete.title}»</span> будет стерта.
                  </p>
                </div>
                <div className="flex justify-end gap-3 mt-2">
                  <button type="button" onClick={() => setTaskToDelete(null)} className="px-4 py-2 text-[14px] font-medium rounded-lg text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors">Отмена</button>
                  <button type="button" onClick={() => taskToDelete.id && handleDeleteTask(taskToDelete.id)} className="px-5 py-2 text-[14px] font-bold rounded-lg bg-[#ef4444] text-white hover:opacity-90 transition-opacity">Удалить (Enter)</button>
                </div>
              </div>
          )}
        </Modal>
      </div>
  );
};