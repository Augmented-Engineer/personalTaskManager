import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, ChevronDown } from 'lucide-react';
import { db, getTodayEpochDay } from '../db/db';
import { epochDayToDate } from '../utils/dateUtils';
import type { Task, Subtask } from '../types';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';

type FinanceRange = 'day' | 'week' | 'month';

export const HomeScreen: React.FC<{ onNavigateToTasks: () => void }> = ({ onNavigateToTasks }) => {
  const todayEpoch = getTodayEpochDay();
  const [financeRange, setFinanceRange] = useState<FinanceRange>('day');
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});

  // 1. Оптимизированный батч-запрос задач и подзадач (устранение N+1)
  const tasks = useLiveQuery(async () => {
    const list = await db.tasks.where('dateEpochDay').equals(todayEpoch).sortBy('id');
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
  }, [todayEpoch]) || [];

  // 2. Получение настроек и транзакций
  const settings = useLiveQuery(() => db.settings.get('global_settings'));
  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];

  // 3. Вычисления финансов
  const periodTxs = allTransactions.filter(t => {
    if (!t.isExpense) return false;
    if (financeRange === 'day') return t.dateEpochDay === todayEpoch;
    if (financeRange === 'week') {
      const txDate = epochDayToDate(t.dateEpochDay);
      const now = new Date();
      return Math.abs(now.getTime() - txDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    }
    if (financeRange === 'month') {
      const txDate = epochDayToDate(t.dateEpochDay);
      const now = new Date();
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const periodTotalSpent = periodTxs.reduce((sum, t) => sum + t.amount, 0);

  const todayDailySpent = allTransactions
      .filter(t => t.dateEpochDay === todayEpoch && t.isExpense && t.isDaily)
      .reduce((sum, t) => sum + t.amount, 0);

  const baseLimit = settings?.dailyBudgetLimit || 0;
  const remainingBudget = Math.max(0, baseLimit - todayDailySpent);
  const budgetPercent = baseLimit > 0 ? Math.min(100, (todayDailySpent / baseLimit) * 100) : 0;

  // 4. Вычисления задач
  const totalSteps = tasks.reduce((sum, t) => sum + (t.subtasks && t.subtasks.length > 0 ? t.subtasks.length : 1), 0);
  const doneSteps = tasks.reduce((sum, t) => {
    if (t.subtasks && t.subtasks.length > 0) {
      return sum + t.subtasks.filter((s: Subtask) => s.isCompleted).length;
    }
    return sum + (t.isCompleted ? 1 : 0);
  }, 0);
  const focusPercent = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  // 5. Обработчики
  const toggleTask = async (task: Task) => {
    if (!task.id) return;
    const nextStatus = !task.isCompleted;
    await db.tasks.update(task.id, { isCompleted: nextStatus });
    if (task.subtasks) {
      for (const s of task.subtasks) {
        if (s.id) await db.subtasks.update(s.id, { isCompleted: nextStatus });
      }
    }
  };

  const toggleSubtask = async (task: Task, subtask: Subtask) => {
    if (!subtask.id || !task.id) return;
    const nextStatus = !subtask.isCompleted;
    await db.subtasks.update(subtask.id, { isCompleted: nextStatus });

    const allSubtasks = await db.subtasks.where('taskId').equals(task.id).toArray();
    const updated = allSubtasks.map(s => s.id === subtask.id ? { ...s, isCompleted: nextStatus } : s);
    const allDone = updated.length > 0 && updated.every(s => s.isCompleted);

    if (task.isCompleted !== allDone) {
      await db.tasks.update(task.id, { isCompleted: allDone });
    }
  };

  const toggleExpand = (taskId: number) => setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));

  const RANGES: FinanceRange[] = ['day', 'week', 'month'];
  const activeRangeIndex = RANGES.indexOf(financeRange);

  return (
      <div className="flex flex-col gap-8 pb-24 lg:pb-8 w-full text-left items-start">

        {/* ВЕРХНИЙ РЯД: Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">

          {/* Карточка 1: Эффективность */}
          <div className="item-reveal delay-100 bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-white/20 shadow-lg group">
            <div>
              <div className="text-[2.8rem] leading-none font-extrabold tracking-tight text-text-primary-dark">
                <AnimatedNumber value={focusPercent} /><span className="text-2xl text-text-secondary-dark ml-1">%</span>
              </div>
              <div className="text-[0.92rem] text-text-secondary-dark mt-2 font-medium">Эффективность дня</div>
            </div>
            <div className="mt-8">
              <div className="w-full bg-item-dark h-1.5 rounded-full overflow-hidden">
                <div className="bg-text-primary-dark h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${focusPercent}%` }} />
              </div>
              <div className="text-xs text-text-secondary-dark mt-2 font-mono">
                <AnimatedNumber value={doneSteps} /> / <AnimatedNumber value={totalSteps} /> задач
              </div>
            </div>
          </div>

          {/* Карточка 2: Траты */}
          <div className="item-reveal delay-200 bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-white/20 shadow-lg group">
            <div>
              <div className="text-[2.8rem] leading-none font-extrabold tracking-tight text-text-primary-dark">
                <AnimatedNumber value={periodTotalSpent} /><span className="text-2xl text-text-secondary-dark ml-2">₽</span>
              </div>
              <div className="text-[0.92rem] text-text-secondary-dark mt-2 font-medium">
                Траты ({financeRange === 'day' ? 'Сегодня' : financeRange === 'week' ? 'Неделя' : 'Месяц'})
              </div>
            </div>

            <div className="mt-8">
              <div className="relative flex bg-item-dark p-1 rounded-xl border border-border-dark w-full z-0">
                <div
                    className="absolute top-1 bottom-1 left-1 bg-card-dark border border-border-dark rounded-lg shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] -z-10"
                    style={{ width: 'calc((100% - 8px) / 3)', transform: `translateX(calc(${activeRangeIndex} * 100%))` }}
                />
                {RANGES.map((range) => {
                  const labels: Record<FinanceRange, string> = { day: 'День', week: 'Нед', month: 'Мес' };
                  return (
                      <button
                          key={range}
                          onClick={() => setFinanceRange(range)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-300 ${
                              financeRange === range ? 'text-text-primary-dark' : 'text-text-secondary-dark hover:text-text-primary-dark'
                          }`}
                      >
                        {labels[range]}
                      </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Карточка 3: Бюджет */}
          <div className="item-reveal delay-300 bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-white/20 shadow-lg group">
            <div>
              <div className="text-[2.8rem] leading-none font-extrabold tracking-tight text-text-primary-dark">
                <AnimatedNumber value={remainingBudget} /><span className="text-2xl text-text-secondary-dark ml-2">₽</span>
              </div>
              <div className="text-[0.92rem] text-text-secondary-dark mt-2 font-medium flex justify-between">
                Остаток бюджета
              </div>
            </div>
            <div className="mt-8">
              <div className="w-full bg-item-dark h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#ef4444] h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${budgetPercent}%` }} />
              </div>
              <div className="flex justify-between text-xs text-text-secondary-dark mt-2 font-mono">
                <span>Лимит: <AnimatedNumber value={baseLimit} /> ₽</span>
                <span className="text-[#ef4444]">-<AnimatedNumber value={todayDailySpent} /> ₽</span>
              </div>
            </div>
          </div>

        </div>

        {/* НИЖНИЙ РЯД: Задачи */}
        <div className="flex flex-col gap-4 w-full item-reveal delay-400">
          <div className="flex justify-between items-end px-1 border-b border-border-dark pb-4">
            <h2 className="text-xl font-bold text-text-primary-dark tracking-tight">Задачи на сегодня</h2>
            <button onClick={onNavigateToTasks} className="text-sm font-medium text-text-secondary-dark hover:text-text-primary-dark transition-colors">
              Управление
            </button>
          </div>

          {tasks.length === 0 ? (
              <div className="py-16 text-center text-text-secondary-dark text-[14px] bg-card-dark border border-border-dark rounded-[20px] border-dashed shadow-sm">
                Все задачи выполнены. Вы великолепны.
              </div>
          ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 w-full">
                {tasks.map((task) => {
                  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                  const isExpanded = expandedTasks[task.id!] || false;

                  return (
                      <div key={task.id} className="bg-card-dark border border-border-dark rounded-[16px] p-5 flex flex-col transition-colors hover:border-white/10 shadow-sm group">
                        <div className="flex items-center gap-4">

                          <div className="flex-1 flex flex-col cursor-pointer" onClick={() => hasSubtasks && toggleExpand(task.id!)}>
                            <div className="flex items-center gap-2">
                        <span className={`text-[15px] font-semibold transition-colors ${task.isCompleted ? 'line-through text-text-secondary-dark' : 'text-text-primary-dark'}`}>
                          {task.title}
                        </span>
                              {hasSubtasks && (
                                  <span className={`text-text-secondary-dark transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                            <ChevronDown size={16} />
                          </span>
                              )}
                            </div>
                            <span className="text-[12px] text-text-secondary-dark mt-1 font-mono">
                        {hasSubtasks ? `Steps: ${task.subtasks!.filter((s: Subtask) => s.isCompleted).length}/${task.subtasks!.length}` : 'Task'}
                      </span>
                          </div>

                          <button
                              type="button"
                              onClick={() => toggleTask(task)}
                              className={`w-6 h-6 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                                  task.isCompleted ? 'bg-text-primary-dark border-text-primary-dark text-bg-dark scale-105' : 'border-text-secondary-dark hover:border-text-primary-dark text-transparent'
                              }`}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                        </div>

                        {hasSubtasks && (
                            <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                              <div className="overflow-hidden">
                                <div className="pl-2 pt-3 pb-1 border-t border-border-dark flex flex-col gap-3">
                                  {task.subtasks!.map((subtask: Subtask) => (
                                      <div key={subtask.id} onClick={() => toggleSubtask(task, subtask)} className="flex items-center gap-3 cursor-pointer group/sub">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${subtask.isCompleted ? 'bg-text-secondary-dark border-text-secondary-dark text-bg-dark' : 'border-border-dark group-hover/sub:border-text-secondary-dark text-transparent'}`}>
                                          <Check size={10} strokeWidth={3} />
                                        </div>
                                        <span className={`text-[13px] transition-colors ${subtask.isCompleted ? 'line-through text-text-secondary-dark' : 'text-text-primary-dark'}`}>
                                {subtask.title}
                              </span>
                                      </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                        )}
                      </div>
                  );
                })}
              </div>
          )}
        </div>
      </div>
  );
};