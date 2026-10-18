import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, TrendingUp, TrendingDown, Target, BarChart3, AlertCircle } from 'lucide-react';
import { db, getTodayEpochDay } from '../db/db';
import { epochDayToDate } from '../utils/dateUtils';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import type { PriorityType } from '../types';
import { PRIORITIES } from '../types';

type TabType = 'finances' | 'tasks';
type PeriodType = '7d' | '30d' | 'all';

const TABS: { id: TabType; label: string }[] = [
    { id: 'finances', label: 'Финансы' },
    { id: 'tasks', label: 'Задачи' }
];

const PERIODS: { id: PeriodType; label: string; days: number }[] = [
    { id: '7d', label: '7 дней', days: 7 },
    { id: '30d', label: '30 дней', days: 30 },
    { id: 'all', label: 'Всё время', days: 9999 }
];

export const AnalyticsScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('finances');
    const [activePeriod, setActivePeriod] = useState<PeriodType>('7d');

    const todayEpoch = getTodayEpochDay();
    const periodDays = PERIODS.find(p => p.id === activePeriod)?.days || 7;
    const startEpoch = activePeriod === 'all' ? 0 : todayEpoch - periodDays + 1;

    // --- ДАННЫЕ: ЗАДАЧИ ---
    const rawTasks = useLiveQuery(() => db.tasks.toArray()) || [];
    const rawSubtasks = useLiveQuery(() => db.subtasks.toArray()) || [];

    const tasksData = useMemo(() => {
        const filteredTasks = rawTasks.filter(t => t.dateEpochDay >= startEpoch && t.dateEpochDay <= todayEpoch);

        let totalSteps = 0;
        let doneSteps = 0;

        const dynamicsMap: Record<number, { total: number; done: number }> = {};
        for (let i = startEpoch; i <= todayEpoch; i++) {
            dynamicsMap[i] = { total: 0, done: 0 };
        }

        const prioritiesCount = { LOW: 0, MEDIUM: 0, HIGH: 0 };
        const prioritiesDone = { LOW: 0, MEDIUM: 0, HIGH: 0 };

        filteredTasks.forEach(task => {
            const taskSubs = rawSubtasks.filter(s => s.taskId === task.id);
            const tSteps = taskSubs.length > 0 ? taskSubs.length : 1;
            const dSteps = taskSubs.length > 0 ? taskSubs.filter(s => s.isCompleted).length : (task.isCompleted ? 1 : 0);

            totalSteps += tSteps;
            doneSteps += dSteps;

            if (dynamicsMap[task.dateEpochDay]) {
                dynamicsMap[task.dateEpochDay].total += tSteps;
                dynamicsMap[task.dateEpochDay].done += dSteps;
            }

            prioritiesCount[task.priority] += tSteps;
            prioritiesDone[task.priority] += dSteps;
        });

        const efficiency = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

        const dynamics = Object.entries(dynamicsMap).map(([epoch, data]) => {
            const date = epochDayToDate(Number(epoch));
            const dayName = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][date.getDay()];
            const percent = data.total > 0 ? (data.done / data.total) * 100 : 0;
            return { dayName, percent, ...data };
        });

        return { totalSteps, doneSteps, efficiency, dynamics, prioritiesCount, prioritiesDone };
    }, [rawTasks, rawSubtasks, startEpoch, todayEpoch]);


    // --- ДАННЫЕ: ФИНАНСЫ ---
    const rawTxs = useLiveQuery(() => db.transactions.toArray()) || [];

    const financesData = useMemo(() => {
        const filteredTxs = rawTxs.filter(t => t.dateEpochDay >= startEpoch && t.dateEpochDay <= todayEpoch);

        let income = 0;
        let expense = 0;
        const categoryTotals: Record<string, number> = {};

        filteredTxs.forEach(t => {
            if (t.isExpense) {
                expense += t.amount;
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            } else {
                income += t.amount;
            }
        });

        const balance = income - expense;
        const sortedCategories = Object.entries(categoryTotals)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);

        return { income, expense, balance, categories: sortedCategories };
    }, [rawTxs, startEpoch, todayEpoch]);

    const tabIndex = TABS.findIndex(t => t.id === activeTab);
    const periodIndex = PERIODS.findIndex(p => p.id === activePeriod);

    return (
        <div className="flex flex-col gap-6 w-full pb-24 lg:pb-8 text-left animate-in fade-in duration-500">

            {/* 1. ГЛАВНЫЕ ТАБЫ (Финансы / Задачи) */}
            <div className="relative flex bg-item-dark p-1.5 rounded-[16px] border border-border-dark w-full max-w-sm mx-auto z-0 item-reveal delay-100">
                <div
                    className="absolute top-1.5 bottom-1.5 bg-text-primary-dark rounded-xl shadow-md transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] -z-10"
                    style={{ width: 'calc((100% - 12px) / 2)', transform: `translateX(calc(${tabIndex} * 100%))` }}
                />
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2.5 text-[15px] font-bold transition-colors duration-300 ${
                            activeTab === tab.id ? "text-bg-dark" : "text-text-secondary-dark hover:text-text-primary-dark"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 2. ПЕРЕКЛЮЧАТЕЛЬ ПЕРИОДОВ */}
            <div className="relative flex bg-item-dark p-1 rounded-xl border border-border-dark w-full z-0 item-reveal delay-200">
                <div
                    className="absolute top-1 bottom-1 bg-card-dark border border-border-dark rounded-lg shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] -z-10"
                    style={{ width: 'calc((100% - 8px) / 3)', transform: `translateX(calc(${periodIndex} * 100%))` }}
                />
                {PERIODS.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => setActivePeriod(p.id)}
                        className={`flex-1 py-2 text-[13px] font-semibold transition-colors duration-300 ${
                            activePeriod === p.id ? "text-text-primary-dark" : "text-text-secondary-dark hover:text-text-primary-dark"
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* 3. КОНТЕНТ (ЗАДАЧИ) */}
            {activeTab === 'tasks' && (
                <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">

                    <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 flex items-center justify-between shadow-lg item-reveal delay-300 transition-colors hover:border-white/10 group">
                        <div className="flex flex-col gap-2">
                            <span className="text-[14px] font-bold text-text-secondary-dark tracking-wide uppercase">Эффективность</span>
                            <div className="flex items-baseline gap-1">
                <span className="text-[3.5rem] leading-none font-extrabold tracking-tight text-text-primary-dark">
                  <AnimatedNumber value={tasksData.efficiency} />
                </span>
                                <span className="text-2xl font-bold text-text-secondary-dark">%</span>
                            </div>
                            <span className="text-[13px] text-text-secondary-dark font-medium mt-1">
                <AnimatedNumber value={tasksData.doneSteps} /> из <AnimatedNumber value={tasksData.totalSteps} /> выполнено
              </span>
                        </div>
                        <div className="w-20 h-20 rounded-full border-4 border-item-dark flex items-center justify-center relative">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="50%" cy="50%" r="36" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-text-primary-dark transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]" strokeDasharray="226" strokeDashoffset={226 - (226 * tasksData.efficiency) / 100} />
                            </svg>
                            <Check size={32} strokeWidth={3} className="text-text-primary-dark" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                        <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 flex flex-col gap-6 shadow-lg item-reveal delay-400 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={20} className="text-text-primary-dark" />
                                <h3 className="text-[16px] font-bold text-text-primary-dark">Динамика ({PERIODS[periodIndex].label})</h3>
                            </div>

                            <div className="flex-1 flex items-end gap-2 h-40 mt-4 overflow-x-auto custom-scrollbar pb-2">
                                {tasksData.dynamics.map((d, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-[32px]">
                                        <div className="w-full bg-item-dark rounded-t-md h-full flex flex-col justify-end overflow-hidden relative group/bar">
                                            <div
                                                className="w-full bg-text-primary-dark transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] rounded-t-md"
                                                style={{ height: `${d.percent}%`, minHeight: d.done > 0 ? '4px' : '0' }}
                                            />
                                            <div className="absolute inset-0 bg-bg-dark/40 opacity-0 group-hover/bar:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-text-primary-dark -rotate-90">{d.done}</span>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-semibold text-text-secondary-dark">{d.dayName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 flex flex-col gap-6 shadow-lg item-reveal delay-500 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-2">
                                <Target size={20} className="text-text-primary-dark" />
                                <h3 className="text-[16px] font-bold text-text-primary-dark">По приоритетам</h3>
                            </div>

                            <div className="flex flex-col gap-5 mt-2">
                                {(['HIGH', 'MEDIUM', 'LOW'] as PriorityType[]).map(p => {
                                    const total = tasksData.prioritiesCount[p];
                                    const done = tasksData.prioritiesDone[p];
                                    const percent = total > 0 ? (done / total) * 100 : 0;

                                    // Стилизация приоритетов через прозрачность (Строгий стиль)
                                    const opacityMap: Record<string, string> = { HIGH: '1', MEDIUM: '0.6', LOW: '0.3' };

                                    return (
                                        <div key={p} className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-text-primary-dark" style={{ opacity: opacityMap[p] }} />
                                                    <span className="text-[14px] font-semibold text-text-primary-dark">{PRIORITIES[p].title}</span>
                                                </div>
                                                <span className="text-[13px] font-mono text-text-secondary-dark">{done} / {total}</span>
                                            </div>
                                            <div className="w-full bg-item-dark h-2 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] bg-text-primary-dark" style={{ width: `${percent}%`, opacity: opacityMap[p] }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. КОНТЕНТ (ФИНАНСЫ) */}
            {activeTab === 'finances' && (
                <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">

                    <div className="grid grid-cols-2 gap-4 w-full item-reveal delay-300">
                        <div className="bg-card-dark border border-border-dark rounded-[20px] p-5 lg:p-6 flex flex-col justify-between shadow-lg hover:-translate-y-1 hover:border-white/10 transition-all duration-300">
                            <span className="text-[13px] font-semibold text-text-secondary-dark tracking-wide uppercase flex items-center gap-1.5"><TrendingUp size={16} /> Доходы</span>
                            <span className="text-[24px] lg:text-[2rem] leading-none font-extrabold tracking-tight text-text-primary-dark mt-3">
                +<AnimatedNumber value={financesData.income} /> <span className="text-xl text-text-secondary-dark">₽</span>
              </span>
                        </div>

                        <div className="bg-card-dark border border-border-dark rounded-[20px] p-5 lg:p-6 flex flex-col justify-between shadow-lg hover:-translate-y-1 hover:border-white/10 transition-all duration-300">
                            <span className="text-[13px] font-semibold text-text-secondary-dark tracking-wide uppercase flex items-center gap-1.5"><TrendingDown size={16} /> Расходы</span>
                            <span className="text-[24px] lg:text-[2rem] leading-none font-extrabold tracking-tight text-text-primary-dark mt-3">
                -<AnimatedNumber value={financesData.expense} /> <span className="text-xl text-text-secondary-dark">₽</span>
              </span>
                        </div>
                    </div>

                    <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 flex items-center justify-between shadow-lg item-reveal delay-400 hover:border-white/10 transition-colors">
                        <div className="flex flex-col gap-1">
                            <span className="text-[14px] font-bold text-text-secondary-dark tracking-wide uppercase">Сальдо за период</span>
                            <span className="text-[32px] leading-none font-extrabold tracking-tight mt-1 text-text-primary-dark">
                {financesData.balance > 0 ? '+' : ''}<AnimatedNumber value={financesData.balance} /> ₽
              </span>
                        </div>
                        <div className="px-4 py-2 rounded-xl text-[13px] font-bold uppercase tracking-wider bg-item-dark border border-border-dark text-text-primary-dark">
                            {financesData.balance >= 0 ? 'Профицит' : 'Дефицит'}
                        </div>
                    </div>

                    <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 flex flex-col gap-6 shadow-lg item-reveal delay-500 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={20} className="text-text-primary-dark" />
                            <h3 className="text-[16px] font-bold text-text-primary-dark">Структура расходов</h3>
                        </div>

                        {financesData.categories.length === 0 ? (
                            <div className="py-10 text-center text-text-secondary-dark text-[13px] font-medium border border-dashed border-border-dark rounded-xl">
                                Нет данных для анализа
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 mt-2">
                                {financesData.categories.map((cat, idx) => {
                                    const percent = financesData.expense > 0 ? (cat.amount / financesData.expense) * 100 : 0;
                                    return (
                                        <div key={idx} className="flex flex-col gap-2 group">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-text-primary-dark" />
                                                    <span className="text-[14px] font-semibold text-text-primary-dark">{cat.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[12px] font-bold text-text-secondary-dark">{Math.round(percent)}%</span>
                                                    <span className="text-[14px] font-bold text-text-primary-dark font-mono"><AnimatedNumber value={cat.amount} /> ₽</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-item-dark h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] bg-text-primary-dark"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            )}

        </div>
    );
};