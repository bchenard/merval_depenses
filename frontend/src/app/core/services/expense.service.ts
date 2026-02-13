import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Expense,
  ExpenseCreateInput,
  ExpenseUpdateInput,
  MonthlyEstimate,
  ApiResponse
} from '../../shared/models/expense.model';

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

