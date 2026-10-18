export type PriorityType = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PriorityInfo {
  type: PriorityType;
  title: string;
  color: string;
}

export const PRIORITIES: Record<PriorityType, PriorityInfo> = {
  LOW: { type: 'LOW', title: 'Низкий', color: '#2ED573' },
  MEDIUM: { type: 'MEDIUM', title: 'Средний', color: '#FFA502' },
  HIGH: { type: 'HIGH', title: 'Высокий', color: '#FF4757' },
};

export interface Subtask {
  id?: number;
  taskId: number;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id?: number;
  title: string;
  dateEpochDay: number;
  timeText?: string | null;
  priority: PriorityType;
  isCompleted: boolean;
  subtasks?: Subtask[];
}

export interface Account {
  id?: number;
  name: string;
  balance: number;
}

export interface Category {
  id?: number;
  name: string;
  isExpense: boolean;
}

export interface Transaction {
  id?: number;
  title: string;
  amount: number;
  category: string;
  accountId: number;
  dateEpochDay: number;
  isExpense: boolean;
  isDaily: boolean;
}





export interface AppSettings {
  id: string;
  dailyBudgetLimit: number;
  dailyBudgetStartEpoch: number;
  isDark: boolean;
  currentAccentHex: string;
}

export interface Note {
  id?: number;
  title: string;
  content: string;
  updatedAt: number;
}

export interface Debt {
  id?: number;
  type: 'owe_me' | 'i_owe';
  name: string;
  amount: number;
  dateEpochDay: number;
  description: string;
}
