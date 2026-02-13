import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private getApiUrl(): string {
    const isBrowser = isPlatformBrowser(this.platformId);
    if (isBrowser && window.location.hostname !== 'localhost') {
      return 'https://europe-west9-merval-depenses-app.cloudfunctions.net';
    }
    if (isBrowser) {
      return 'http://localhost:5001/merval-depenses-app/europe-west9';
    }
    return 'https://europe-west9-merval-depenses-app.cloudfunctions.net';
  }

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  getExpenses(): Observable<ApiResponse<Expense[]>> {
    return this.http.get<ApiResponse<Expense[]>>(`${this.getApiUrl()}/getExpenses`);
  }

  getMonthlyEstimate(): Observable<ApiResponse<MonthlyEstimate>> {
    return this.http.get<ApiResponse<MonthlyEstimate>>(`${this.getApiUrl()}/getMonthlyEstimate`);
  }

  createExpense(expense: ExpenseCreateInput): Observable<ApiResponse<Expense>> {
    return this.http.post<ApiResponse<Expense>>(`${this.getApiUrl()}/createExpense`, expense);
  }

  updateExpense(expense: ExpenseUpdateInput): Observable<ApiResponse<Expense>> {
    return this.http.put<ApiResponse<Expense>>(`${this.getApiUrl()}/updateExpense`, expense);
  }

  deleteExpense(id: number): Observable<ApiResponse<Expense>> {
    return this.http.delete<ApiResponse<Expense>>(`${this.getApiUrl()}/deleteExpense?id=${id}`);
  }
}
