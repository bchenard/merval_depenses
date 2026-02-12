import { Injectable } from '@angular/core';
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
  private readonly API_URL = 'http://localhost:5001/merval-depenses-app/us-central1';

  constructor(private http: HttpClient) {}

  getExpenses(): Observable<ApiResponse<Expense[]>> {
    return this.http.get<ApiResponse<Expense[]>>(`${this.API_URL}/getExpenses`);
  }

  createExpense(expense: ExpenseCreateInput): Observable<ApiResponse<Expense>> {
    return this.http.post<ApiResponse<Expense>>(`${this.API_URL}/createExpense`, expense);
  }

  updateExpense(expense: ExpenseUpdateInput): Observable<ApiResponse<Expense>> {
    return this.http.put<ApiResponse<Expense>>(`${this.API_URL}/updateExpense`, expense);
  }

  deleteExpense(id: number): Observable<ApiResponse<Expense>> {
    return this.http.delete<ApiResponse<Expense>>(`${this.API_URL}/deleteExpense?id=${id}`);
  }
}

