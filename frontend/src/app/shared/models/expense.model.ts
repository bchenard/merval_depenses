export type ExpenseCategory = 'sorties' | 'courses' | 'essences' | 'achats exceptionnels';

export interface Expense {
  id?: number;
  amount: number;
  place: string;
  expense_date: string;
  category: ExpenseCategory;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseCreateInput {
  amount: number;
  place: string;
  expense_date: string;
  category: ExpenseCategory;
}

export interface ExpenseUpdateInput extends ExpenseCreateInput {
  id: number;
}

export interface MonthlyEstimate {
  totalSoFar: number;
  daysElapsed: number;
  daysInMonth: number;
  estimatedTotal: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

