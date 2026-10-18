import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Edit2, Plus, CreditCard, Trash2 } from 'lucide-react';
import { db, getTodayEpochDay } from '../db/db';
import { epochDayToDate } from '../utils/dateUtils';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import type { Account } from '../types';
import { BudgetModal } from '../components/finances/BudgetModal';
import { AccountModal } from '../components/finances/AccountModal';
import { DeleteAccountModal } from '../components/finances/DeleteAccountModal';

type DateRange = 'all' | 'today' | 'week' | 'month';
const RANGES: DateRange[] = ['all', 'today', 'week', 'month'];

export const FinancesScreen: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<DateRange>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  const todayEpoch = getTodayEpochDay();
  const settings = useLiveQuery(() => db.settings.get('global_settings'));
  const rawAccounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const accounts: Account[] = rawAccounts as Account[];
  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const todayTxs = allTransactions.filter(t => t.dateEpochDay === todayEpoch && t.isExpense);
  const todayDailySpent = todayTxs.filter(t => t.isDaily).reduce((sum, t) => sum + t.amount, 0);
  const todayRegularSpent = todayTxs.filter(t => !t.isDaily).reduce((sum, t) => sum + t.amount, 0);
  const todayTotalSpent = todayDailySpent + todayRegularSpent;

  const baseLimit = settings?.dailyBudgetLimit || 0;
  const remainingBudget = Math.max(0, baseLimit - todayDailySpent);
  const budgetProgress = baseLimit > 0 ? Math.min(100, (todayDailySpent / baseLimit) * 100) : 0;

  const filteredTxs = allTransactions.filter(t => {
    if (selectedAccountId !== null && t.accountId !== selectedAccountId) return false;
    if (!t.isExpense) return false;

    if (selectedRange === 'today') return t.dateEpochDay === todayEpoch;
    if (selectedRange === 'week') {
      const txDate = epochDayToDate(t.dateEpochDay);
      const now = new Date();
      return Math.abs(now.getTime() - txDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    }
    if (selectedRange === 'month') {
      const txDate = epochDayToDate(t.dateEpochDay);
      const now = new Date();
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const periodExpenses = filteredTxs.reduce((sum, t) => sum + t.amount, 0);

  const categoryTotals = filteredTxs.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryTotals)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const activeRangeIndex = RANGES.indexOf(selectedRange);

  const handleSaveBudget = async (limit: number) => {
    const exists = await db.settings.get('global_settings');
    if (exists) {
      await db.settings.update('global_settings', { dailyBudgetLimit: limit });
    } else {
      await db.settings.put({
        id: 'global_settings',
        dailyBudgetLimit: limit,
        dailyBudgetStartEpoch: todayEpoch,
        isDark: true,
        currentAccentHex: '#3b82f6',
      });
    }
  };

  const handleSaveAccount = async (name: string, balance: number) => {
    if (accountToEdit && accountToEdit.id) {
      await db.accounts.update(accountToEdit.id, { name, balance });
    } else {
      await db.accounts.add({ name, balance });
    }
    setAccountToEdit(null);
  };

  const handleDeleteAccount = async () => {
    if (accountToDelete && accountToDelete.id) {
      await db.accounts.delete(accountToDelete.id);
      if (selectedAccountId === accountToDelete.id) setSelectedAccountId(null);
    }
    setAccountToDelete(null);
  };

  return (
    <div className="flex flex-col gap-8 pb-24 lg:pb-8 w-full text-left items-start animate-in fade-in duration-500 relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full item-reveal delay-100">
        <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-white/20 shadow-lg">
          <div>
            <div className="text-[2.8rem] leading-none font-extrabold tracking-tight text-text-primary-dark">
              <AnimatedNumber value={totalBalance} /><span className="text-2xl text-text-secondary-dark ml-2">₽</span>
            </div>
            <div className="text-[0.92rem] text-text-secondary-dark mt-2 font-medium">Общий баланс</div>
          </div>
          <div className="mt-8 pt-4 border-t border-border-dark flex justify-between text-xs text-text-secondary-dark font-mono">
            <span>Счетов: {accounts.length}</span>
            <span className="text-text-primary-dark">Все активы</span>
          </div>
        </div>

        <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-white/20 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[2.8rem] leading-none font-extrabold tracking-tight text-text-primary-dark">
                <AnimatedNumber value={remainingBudget} /><span className="text-2xl text-text-secondary-dark ml-2">₽</span>
              </div>
              <div className="text-[0.92rem] text-text-secondary-dark mt-2 font-medium">Остаток бюджета</div>
            </div>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark p-2 rounded-lg transition-colors"
            >
              <Edit2 size={16} />
            </button>
          </div>
          <div className="mt-8">
            <div className="w-full bg-item-dark h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#ef4444] h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${budgetProgress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-text-secondary-dark mt-2 font-mono">
              <span>Лимит: <AnimatedNumber value={baseLimit} /></span>
              <span className="text-[#ef4444]">-<AnimatedNumber value={todayDailySpent} /></span>
            </div>
          </div>
        </div>

        <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-white/20 shadow-lg">
          <div>
            <div className="text-[2.8rem] leading-none font-extrabold tracking-tight text-text-primary-dark">
              <AnimatedNumber value={todayTotalSpent} /><span className="text-2xl text-text-secondary-dark ml-2">₽</span>
            </div>
            <div className="text-[0.92rem] text-text-secondary-dark mt-2 font-medium">Траты за день</div>
          </div>
          
          <div className="mt-8 flex justify-between items-center border-t border-border-dark pt-4">
            <div className="flex items-center gap-2 text-xs text-text-secondary-dark font-mono">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
              Day: <span className="text-text-primary-dark font-bold"><AnimatedNumber value={todayDailySpent} /></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary-dark font-mono">
              <span className="w-2 h-2 rounded-full bg-[#E5A93C]" />
              Reg: <span className="text-text-primary-dark font-bold"><AnimatedNumber value={todayRegularSpent} /></span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full item-reveal delay-200">
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="flex justify-between items-end px-1 border-b border-border-dark pb-4">
            <h2 className="text-xl font-bold text-text-primary-dark tracking-tight">Счета</h2>
            <button
              onClick={() => {
                setAccountToEdit(null);
                setIsAccountModalOpen(true);
              }}
              className="text-sm font-medium text-accent hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              <Plus size={16} /> Добавить
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setSelectedAccountId(null)}
              className={`p-5 rounded-[16px] border text-left transition-all duration-200 flex justify-between items-center ${
                selectedAccountId === null ? 'bg-item-dark border-border-dark shadow-sm' : 'bg-card-dark border-border-dark hover:bg-item-dark/50 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <CreditCard size={20} className={selectedAccountId === null ? 'text-text-primary-dark' : 'text-text-secondary-dark'} />
                <span className="text-[15px] font-semibold text-text-primary-dark">Все счета</span>
              </div>
              <span className="text-[15px] font-bold text-text-primary-dark"><AnimatedNumber value={totalBalance} /> ₽</span>
            </button>

            {accounts.map(acc => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id || null)}
                  className={`p-5 rounded-[16px] border text-left transition-all duration-200 flex justify-between items-center group cursor-pointer ${
                    isSelected ? 'bg-item-dark border-border-dark shadow-sm' : 'bg-card-dark border-border-dark hover:bg-item-dark/50 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <CreditCard size={20} className={isSelected ? 'text-accent' : 'text-text-secondary-dark group-hover:text-text-primary-dark transition-colors'} />
                    <div className="flex flex-col">
                      <span className="text-[15px] font-semibold text-text-primary-dark">{acc.name}</span>
                      <span className="text-[12px] text-text-secondary-dark font-mono mt-0.5">ID: {acc.id}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-[15px] font-bold text-text-primary-dark"><AnimatedNumber value={acc.balance} /> ₽</span>
                    
                    <div className={`flex gap-1 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'}`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAccountToEdit(acc);
                          setIsAccountModalOpen(true);
                        }}
                        className="p-1.5 rounded-md hover:bg-card-dark transition-colors text-text-secondary-dark hover:text-text-primary-dark"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAccountToDelete(acc);
                        }}
                        className="p-1.5 rounded-md hover:bg-card-dark transition-colors text-text-secondary-dark hover:text-[#ef4444]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-7 item-reveal delay-300">
          <div className="flex justify-between items-end px-1 border-b border-border-dark pb-4">
            <h2 className="text-xl font-bold text-text-primary-dark tracking-tight">Структура расходов</h2>
            <span className="text-[16px] font-black text-text-primary-dark"><AnimatedNumber value={periodExpenses} /> ₽</span>
          </div>

          <div className="relative flex bg-item-dark p-1 rounded-xl border border-border-dark w-full z-0 mb-2">
            <div
              className="absolute top-1 bottom-1 left-1 bg-card-dark border border-border-dark rounded-lg shadow-sm transition-transform duration-300 cubic-bezier(0.22, 1, 0.36, 1) -z-10"
              style={{ width: 'calc((100% - 8px) / 4)', transform: `translateX(calc(${activeRangeIndex} * 100%))` }}
            />
            {RANGES.map((range) => {
              const labels: Record<DateRange, string> = { all: 'Все время', today: 'День', week: 'Неделя', month: 'Месяц' };
              const isSelected = selectedRange === range;
              return (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-300 ${
                    isSelected ? 'text-text-primary-dark' : 'text-text-secondary-dark hover:text-text-primary-dark'
                  }`}
                >
                  {labels[range]}
                </button>
              );
            })}
          </div>

          {sortedCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-secondary-dark text-[14px] bg-card-dark border border-border-dark rounded-[20px] border-dashed">
              Нет расходов за выбранный период
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedCategories.map((cat, idx) => {
                const percent = periodExpenses > 0 ? (cat.amount / periodExpenses) * 100 : 0;
                return (
                  <div key={idx} className="bg-card-dark hover:bg-item-dark/40 transition-colors border border-border-dark rounded-[16px] p-5 flex flex-col gap-3 shadow-sm">
                    <div className="flex justify-between items-center text-[14px]">
                      <span className="font-semibold text-text-primary-dark">{cat.name}</span>
                      <span className="font-bold text-text-primary-dark font-mono"><AnimatedNumber value={cat.amount} /> ₽</span>
                    </div>
                    <div className="w-full bg-item-dark h-1.5 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 bottom-0 left-0 bg-text-primary-dark rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentLimit={baseLimit}
        onSave={handleSaveBudget}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setAccountToEdit(null);
        }}
        accountToEdit={accountToEdit}
        onSave={handleSaveAccount}
      />

      <DeleteAccountModal
        account={accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
};
