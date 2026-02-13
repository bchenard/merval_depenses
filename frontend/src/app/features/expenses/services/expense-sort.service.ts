import { Injectable } from '@angular/core';
import { Expense, ExpenseCategory } from '../../../shared/models/expense.model';

export type SortKey = 'date' | 'place' | 'category';

@Injectable({
  providedIn: 'root'
})
export class ExpenseSortService {
  sortKey: SortKey = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  toggleSort(key: SortKey): void {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      return;
    }

    this.sortKey = key;
    this.sortDirection = 'asc';
  }

  isSortedBy(key: SortKey): boolean {
    return this.sortKey === key;
  }

  getSortIcon(key: SortKey): string {
    if (this.sortKey !== key) {
      return 'unfold_more';
    }

    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  sort(expenses: Expense[]): Expense[] {
    const items = [...expenses];
    if (!this.sortKey) {
      return items;
    }

    const direction = this.sortDirection === 'asc' ? 1 : -1;

    return items.sort((a, b) => {
      switch (this.sortKey) {
        case 'place':
          return a.place.localeCompare(b.place, 'fr', { sensitivity: 'base' }) * direction;
        case 'category':
          return a.category.localeCompare(b.category, 'fr', { sensitivity: 'base' }) * direction;
        case 'date':
        default: {
          const dateA = this.parseExpenseDate(a.expense_date)?.getTime() ?? 0;
          const dateB = this.parseExpenseDate(b.expense_date)?.getTime() ?? 0;
          return (dateA - dateB) * direction;
        }
      }
    });
  }

  private parseExpenseDate(value: string): Date | null {
    if (!value) {
      return null;
    }

    const parts = value.split('-');
    if (parts.length === 3) {
      const [year, month, dayWithTime] = parts;
      const day = dayWithTime.split('T')[0];
      const yearNumber = Number(year);
      const monthNumber = Number(month);
      const dayNumber = Number(day);
      if (!Number.isNaN(yearNumber) && !Number.isNaN(monthNumber) && !Number.isNaN(dayNumber)) {
        return new Date(yearNumber, monthNumber - 1, dayNumber);
      }
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}


