#!/usr/bin/env python3
import os

files = {
    # --------------------------------------------------------------------------
    # 1. src/components/calendar/WeekCalendar.tsx
    # --------------------------------------------------------------------------
    "src/components/calendar/WeekCalendar.tsx": """\
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeekDates, epochDayToDate, dateToEpochDay } from '../../utils/dateUtils';

interface WeekCalendarProps {
  selectedEpochDay: number;
  onSelectDate: (epochDay: number) => void;
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
}

const DAY_NAMES = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  selectedEpochDay,
  onSelectDate,
  weekOffset,
  onWeekOffsetChange,
}) => {
  const weekDays = getWeekDates(weekOffset);
  const selectedDate = epochDayToDate(selectedEpochDay);

  // Заголовок месяца: "Октябрь 2026 г."
  const monthTitle = weekDays[0].toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });
  const capitalizedMonth = monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-text-primary-dark">{capitalizedMonth}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onWeekOffsetChange(weekOffset - 1)}
            className="p-1 rounded-lg hover:bg-card-dark text-text-secondary-dark hover:text-text-primary-dark transition"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => onWeekOffsetChange(0)}
            className="text-[11px] font-semibold px-2 py-0.5 rounded bg-item-dark text-text-secondary-dark hover:text-text-primary-dark"
          >
            Сегодня
          </button>
          <button
            type="button"
            onClick={() => onWeekOffsetChange(weekOffset + 1)}
            className="p-1 rounded-lg hover:bg-card-dark text-text-secondary-dark hover:text-text-primary-dark transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 w-full">
        {weekDays.map((day, idx) => {
          const dayEpoch = dateToEpochDay(day);
          const isSelected = dayEpoch === selectedEpochDay;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(dayEpoch)}
              className={`flex flex-col items-center justify-center aspect-square rounded-pill border transition-all duration-150 ${
                isSelected
                  ? 'bg-accent border-accent text-white shadow-sm'
                  : 'bg-card-dark border-border-dark text-text-secondary-dark hover:border-text-secondary-dark'
              }`}
            >
              <span className={`text-[11px] uppercase ${isSelected ? 'text-white' : 'text-text-secondary-dark'}`}>
                {DAY_NAMES[idx]}
              </span>
              <span className={`text-base font-bold ${isSelected ? 'text-white' : 'text-text-primary-dark'}`}>
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
""",

    # --------------------------------------------------------------------------
    # 2. src/screens/TodayScreen.tsx
    # --------------------------------------------------------------------------
    "src/screens/TodayScreen.tsx": """\
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Check, Clock, Edit2, Trash2, Calendar as RescheduleIcon, ChevronDown, ChevronUp, X } from 'lucide-react';
import { db } from '../db/db';
import { Task, Subtask, PriorityType, PRIORITIES } from '../types';
import { WeekCalendar } from '../components/calendar/WeekCalendar';
import { getTodayEpochDay, formatHeaderDate, epochDayToDate, dateToEpochDay } from '../utils/dateUtils';

export const TodayScreen: React.FC = () => {
  const [selectedEpochDay, setSelectedEpochDay] = useState<number>(getTodayEpochDay());
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Состояния модалок
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToReschedule, setTaskToReschedule] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Реактивный запрос задач и подзадач
  const tasksWithSubtasks = useLiveQuery(async () => {
    const list = await db.tasks
      .where('dateEpochDay')
      .equals(selectedEpochDay)
      .sortBy('id');

    const result: Task[] = [];
    for (const task of list) {
      if (task.id) {
        const subtasks = await db.subtasks.where('taskId').equals(task.id).sortBy('id');
        result.push({ ...task, subtasks });
      }
    }
    return result;
  }, [selectedEpochDay]);

  const tasks = tasksWithSubtasks || [];

  // Подсчет прогресса
  const totalItems = tasks.reduce(
    (acc, t) => acc + (t.subtasks && t.subtasks.length > 0 ? t.subtasks.length : 1),
    0
  );
  const completedItems = tasks.reduce((acc, t) => {
    if (t.subtasks && t.subtasks.length > 0) {
      return acc + t.subtasks.filter((s) => s.isCompleted).length;
    }
    return acc + (t.isCompleted ? 1 : 0);
  }, 0);
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Переключение статуса задачи
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

  // Переключение статуса подзадачи
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

  // Удаление задачи и ее подзадач
  const handleDeleteTask = async (taskId: number) => {
    await db.transaction('rw', db.tasks, db.subtasks, async () => {
      await db.subtasks.where('taskId').equals(taskId).delete();
      await db.tasks.delete(taskId);
    });
    setTaskToDelete(null);
  };

  // Перенос даты задачи
  const handleReschedule = async (task: Task, newEpochDay: number) => {
    if (!task.id) return;
    await db.tasks.update(task.id, { dateEpochDay: newEpochDay });
    setTaskToReschedule(null);
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-black text-text-primary-dark tracking-tight">Планирование</h1>
        <p className="text-xs text-text-secondary-dark">План задач на день</p>
      </div>

      {/* Недельный календарь */}
      <WeekCalendar
        selectedEpochDay={selectedEpochDay}
        onSelectDate={setSelectedEpochDay}
        weekOffset={weekOffset}
        onWeekOffsetChange={setWeekOffset}
      />

      {/* Карточка прогресса дня */}
      <div className="bg-card-dark border border-border-dark rounded-card-lg p-4 flex flex-col gap-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-text-secondary-dark">Выполнение задач</span>
          <span className="font-bold text-accent-green">{progressPercent}%</span>
        </div>
        <div className="w-full bg-item-dark h-2 rounded-full overflow-hidden">
          <div
            className="bg-accent-green h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Заголовок текущего выбранного дня */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-base font-bold text-text-primary-dark">{formatHeaderDate(selectedEpochDay)}</h2>
        <span className="text-xs text-text-secondary-dark">
          {completedItems} из {totalItems} шагов
        </span>
      </div>

      {/* Список задач */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-text-secondary-dark text-sm">
          Задач пока нет. Нажмите «+» внизу
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => handleToggleTask(task)}
              onToggleSubtask={(s) => handleToggleSubtask(task, s)}
              onEdit={() => {
                setTaskToEdit(task);
                setIsTaskModalOpen(true);
              }}
              onReschedule={() => setTaskToReschedule(task)}
              onDelete={() => setTaskToDelete(task)}
            />
          ))}
        </div>
      )}

      {/* Плавающая кнопка добавления задачи */}
      <button
        type="button"
        onClick={() => {
          setTaskToEdit(null);
          setIsTaskModalOpen(true);
        }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[calc(480px-2rem)] h-12 bg-accent hover:opacity-95 text-white font-bold rounded-card shadow-lg flex items-center justify-center gap-2 z-30 transition"
      >
        <Plus size={20} />
        <span>Добавить задачу</span>
      </button>

      {/* Модалка редактирования / добавления */}
      {isTaskModalOpen && (
        <TaskEditModal
          initialTask={taskToEdit}
          currentEpochDay={selectedEpochDay}
          onClose={() => {
            setIsTaskModalOpen(false);
            setTaskToEdit(null);
          }}
        />
      )}

      {/* Модалка переноса даты */}
      {taskToReschedule && (
        <RescheduleModal
          task={taskToReschedule}
          onClose={() => setTaskToReschedule(null)}
          onConfirm={(newEpoch) => handleReschedule(taskToReschedule, newEpoch)}
        />
      )}

      {/* Диалог подтверждения удаления */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card-dark border border-border-dark rounded-card-lg p-5 w-full max-w-sm flex flex-col gap-3">
            <h3 className="text-base font-bold text-text-primary-dark">Удалить задачу?</h3>
            <p className="text-xs text-text-secondary-dark">
              Задача «{taskToDelete.title}» будет удалена безвозвратно.
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-3 py-1.5 text-xs rounded-lg text-text-secondary-dark hover:bg-item-dark"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => taskToDelete.id && handleDeleteTask(taskToDelete.id)}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-accent-red text-white"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Элемент карточки задачи
// -----------------------------------------------------------------------------
interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onToggleSubtask: (subtask: Subtask) => void;
  onEdit: () => void;
  onReschedule: () => void;
  onDelete: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onToggleSubtask,
  onEdit,
  onReschedule,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const priority = PRIORITIES[task.priority] || PRIORITIES.MEDIUM;
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const doneSubtasksCount = task.subtasks ? task.subtasks.filter((s) => s.isCompleted).length : 0;

  return (
    <div className="bg-card-dark border border-border-dark rounded-card p-3.5 flex flex-col gap-2 transition">
      <div className="flex items-center gap-3">
        {/* Полоска приоритета */}
        <div className="w-1 h-9 rounded-full flex-shrink-0" style={{ backgroundColor: priority.color }} />

        {/* Заголовок и инфо */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => hasSubtasks && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`text-sm font-semibold truncate ${
                task.isCompleted ? 'line-through text-text-secondary-dark' : 'text-text-primary-dark'
              }`}
            >
              {task.title}
            </span>
            {hasSubtasks && (
              <span className="text-text-secondary-dark">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-[11px]">
            {task.timeText && (
              <span className="text-accent flex items-center gap-0.5 font-medium">
                <Clock size={12} />
                {task.timeText}
              </span>
            )}
            <span style={{ color: priority.color }}>{priority.title}</span>
            {hasSubtasks && (
              <span className="text-text-secondary-dark">
                • {doneSubtasksCount}/{task.subtasks!.length}
              </span>
            )}
          </div>
        </div>

        {/* Действия над задачей */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReschedule}
            title="Перенести задачу"
            className="p-1.5 rounded-lg text-accent hover:bg-item-dark"
          >
            <RescheduleIcon size={16} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            title="Редактировать"
            className="p-1.5 rounded-lg text-text-secondary-dark hover:bg-item-dark"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Удалить"
            className="p-1.5 rounded-lg text-accent-red hover:bg-item-dark"
          >
            <Trash2 size={16} />
          </button>

          {/* Чекбокс выполнения */}
          <button
            type="button"
            onClick={onToggle}
            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ml-1 ${
              task.isCompleted
                ? 'bg-accent border-accent text-white'
                : 'border-border-dark hover:border-accent text-transparent'
            }`}
          >
            <Check size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Список подзадач */}
      {hasSubtasks && isExpanded && (
        <div className="pl-4 pt-2 border-t border-border-dark flex flex-col gap-2 mt-1">
          {task.subtasks!.map((subtask) => (
            <div
              key={subtask.id}
              onClick={() => onToggleSubtask(subtask)}
              className="flex items-center gap-2.5 cursor-pointer py-0.5 select-none"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  subtask.isCompleted
                    ? 'bg-accent-green border-accent-green text-white'
                    : 'border-border-dark text-transparent'
                }`}
              >
                <Check size={11} strokeWidth={3} />
              </div>
              <span
                className={`text-xs ${
                  subtask.isCompleted ? 'line-through text-text-secondary-dark' : 'text-text-primary-dark'
                }`}
              >
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Модалка создания / редактирования задачи
// -----------------------------------------------------------------------------
interface TaskEditModalProps {
  initialTask: Task | null;
  currentEpochDay: number;
  onClose: () => void;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({ initialTask, currentEpochDay, onClose }) => {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [timeText, setTimeText] = useState(initialTask?.timeText || '');
  const [priority, setPriority] = useState<PriorityType>(initialTask?.priority || 'MEDIUM');
  const [subtasks, setSubtasks] = useState<string[]>(
    initialTask?.subtasks?.map((s) => s.title) || []
  );
  const [newSubtask, setNewSubtask] = useState('');

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    await db.transaction('rw', db.tasks, db.subtasks, async () => {
      let taskId = initialTask?.id;

      if (!taskId) {
        // Создание новой задачи
        taskId = await db.tasks.add({
          title: title.trim(),
          dateEpochDay: currentEpochDay,
          timeText: timeText.trim() || null,
          priority,
          isCompleted: false,
        });
      } else {
        // Обновление существующей
        await db.tasks.update(taskId, {
          title: title.trim(),
          timeText: timeText.trim() || null,
          priority,
        });
        // Удаляем старые подзадачи перед перезаписью
        await db.subtasks.where('taskId').equals(taskId).delete();
      }

      // Сохраняем подзадачи
      for (const subTitle of subtasks) {
        await db.subtasks.add({
          taskId,
          title: subTitle,
          isCompleted: false,
        });
      }
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card-dark border border-border-dark rounded-card-lg p-5 w-full max-w-sm flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-text-primary-dark">
            {initialTask ? 'Редактирование' : 'Новая задача'}
          </h3>
          <button type="button" onClick={onClose} className="text-text-secondary-dark hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Название */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-text-secondary-dark">Название задачи</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Зарядка"
            className="w-full bg-item-dark border border-border-dark rounded-pill px-3 py-2 text-sm text-text-primary-dark outline-none focus:border-accent"
          />
        </div>

        {/* Время */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-text-secondary-dark">Время (ЧЧ:ММ)</label>
          <input
            type="time"
            value={timeText}
            onChange={(e) => setTimeText(e.target.value)}
            className="w-full bg-item-dark border border-border-dark rounded-pill px-3 py-2 text-sm text-text-primary-dark outline-none focus:border-accent"
          />
        </div>

        {/* Приоритет */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-text-secondary-dark">Приоритет</label>
          <div className="grid grid-cols-3 gap-2">
            {(['LOW', 'MEDIUM', 'HIGH'] as PriorityType[]).map((p) => {
              const info = PRIORITIES[p];
              const isSelected = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-1.5 rounded-pill text-xs font-bold transition border ${
                    isSelected
                      ? 'text-white border-transparent'
                      : 'bg-item-dark border-border-dark text-text-secondary-dark'
                  }`}
                  style={{ backgroundColor: isSelected ? info.color : undefined }}
                >
                  {info.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Подзадачи */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-text-secondary-dark">Подзадачи</label>
          {subtasks.map((st, i) => (
            <div key={i} className="flex items-center gap-2 bg-item-dark px-3 py-1.5 rounded-pill">
              <span className="text-xs text-text-primary-dark flex-1 truncate">{st}</span>
              <button
                type="button"
                onClick={() => handleRemoveSubtask(i)}
                className="text-accent-red hover:opacity-80"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
              placeholder="Новая подзадача"
              className="flex-1 bg-item-dark border border-border-dark rounded-pill px-3 py-1.5 text-xs text-text-primary-dark outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="bg-accent px-3 py-1.5 rounded-pill text-white text-xs font-bold"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Кнопка сохранить */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim()}
          className="w-full bg-accent disabled:opacity-40 text-white font-bold py-2.5 rounded-pill text-sm transition mt-2"
        >
          Сохранить
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Модалка быстрого переноса задачи на другую дату
// -----------------------------------------------------------------------------
interface RescheduleModalProps {
  task: Task;
  onClose: () => void;
  onConfirm: (newEpochDay: number) => void;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ task, onClose, onConfirm }) => {
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const d = epochDayToDate(task.dateEpochDay);
    return d.toISOString().split('T')[0];
  });

  const handleApply = () => {
    const parts = selectedDateStr.split('-');
    if (parts.length === 3) {
      const targetDate = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
      onConfirm(dateToEpochDay(targetDate));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card-dark border border-border-dark rounded-card-lg p-5 w-full max-w-xs flex flex-col gap-3">
        <h3 className="text-sm font-bold text-text-primary-dark">Перенести задачу</h3>
        <p className="text-xs text-text-secondary-dark truncate">«{task.title}»</p>
        <input
          type="date"
          value={selectedDateStr}
          onChange={(e) => setSelectedDateStr(e.target.value)}
          className="w-full bg-item-dark border border-border-dark rounded-pill px-3 py-2 text-sm text-text-primary-dark outline-none focus:border-accent"
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-text-secondary-dark hover:bg-item-dark rounded-lg"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-accent text-white"
          >
            Перенести
          </button>
        </div>
      </div>
    </div>
  );
};
""",

    # --------------------------------------------------------------------------
    # 3. src/App.tsx
    # --------------------------------------------------------------------------
    "src/App.tsx": """\
import React, { useState, useEffect } from 'react';
import { AppContainer } from './components/layout/AppContainer';
import { BottomBar, TabType } from './components/layout/BottomBar';
import { TodayScreen } from './screens/TodayScreen';
import { initDatabaseSeeds } from './db/db';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('today');

  useEffect(() => {
    initDatabaseSeeds();
  }, []);

  return (
    <AppContainer>
      {activeTab === 'today' && <TodayScreen />}
      {activeTab === 'finances' && (
        <div className="text-center py-20 text-text-secondary-dark text-sm">Экран Финансов (в разработке)</div>
      )}
      {activeTab === 'add' && (
        <div className="text-center py-20 text-text-secondary-dark text-sm">Экран Записи (в разработке)</div>
      )}
      {activeTab === 'debts' && (
        <div className="text-center py-20 text-text-secondary-dark text-sm">Экран Долгов (в разработке)</div>
      )}
      {activeTab === 'analytics' && (
        <div className="text-center py-20 text-text-secondary-dark text-sm">Экран Аналитики (в разработке)</div>
      )}

      <BottomBar activeTab={activeTab} onTabChange={setActiveTab} />
    </AppContainer>
  );
};

export default App;
""",
}

for filepath, content in files.items():
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created/Updated: {filepath}")

print("\\nГотово! Запусти npm run dev для проверки.")