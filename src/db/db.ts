import Dexie, { type Table } from 'dexie';
import type { Task, Subtask, Account, Category, Transaction, Debt, Note, AppSettings } from '../types';
import { getTodayEpochDay } from '../utils/dateUtils';

export class AppDatabase extends Dexie {
  tasks!: Table<Task, number>;
  subtasks!: Table<Subtask, number>;
  settings!: Table<AppSettings, string>;
  transactions!: Table<Transaction, number>;
  accounts!: Table<Account, number>;
  categories!: Table<Category, number>;
  notes!: Table<Note, number>;
  debts!: Table<Debt, number>;

  constructor() {
    super('TasksPlannerDB');
    this.version(1).stores({
      tasks: '++id, dateEpochDay, isCompleted',
      subtasks: '++id, taskId, isCompleted',
      settings: 'id',
      transactions: '++id, dateEpochDay, accountId, category, isExpense, isDaily',
      accounts: '++id',
      categories: '++id, isExpense',
      notes: '++id, updatedAt',
      debts: '++id, type',
    });
  }
}

export const db = new AppDatabase();

export { getTodayEpochDay };

export async function initDatabaseSeeds() {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      id: 'global_settings',
      dailyBudgetLimit: 1500,
      dailyBudgetStartEpoch: getTodayEpochDay(),
      isDark: true,
      currentAccentHex: '#3b82f6',
    });
  }

  const accountsCount = await db.accounts.count();
  if (accountsCount === 0) {
    await db.accounts.bulkAdd([
      { name: 'Основной', balance: 0 },
      { name: 'Наличные', balance: 0 },
    ]);
  }

  const catCount = await db.categories.count();
  if (catCount === 0) {
    await db.categories.bulkAdd([
      { name: 'Продукты', isExpense: true },
      { name: 'Транспорт', isExpense: true },
      { name: 'Жилье', isExpense: true },
      { name: 'Развлечения', isExpense: true },
      { name: 'Здоровье', isExpense: true },
      { name: 'Связь', isExpense: true },
      { name: 'Другое', isExpense: true },
      { name: 'Зарплата', isExpense: false },
      { name: 'Перевод', isExpense: false },
      { name: 'Подработка', isExpense: false },
    ]);
  }
}

export async function insertTransactionWithBalance(tx: Omit<Transaction, 'id'>) {
  return await db.transaction('rw', [db.transactions, db.accounts], async () => {
    const txId = await db.transactions.add(tx as Transaction);
    const account = await db.accounts.get(tx.accountId);
    if (account && account.id) {
      const delta = tx.isExpense ? -tx.amount : tx.amount;
      await db.accounts.update(account.id, {
        balance: (account.balance || 0) + delta,
      });
    }
    return txId;
  });
}