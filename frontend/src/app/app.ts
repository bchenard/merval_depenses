import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { finalize, timeout } from 'rxjs';

import {
  ExpenseService,
  Expense,
  ExpenseCategory,
  ExpenseCreateInput,
  ExpenseUpdateInput,
  MonthlyEstimate
} from './expense.service';

type SortKey = 'date' | 'place' | 'category';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly categories: ExpenseCategory[] = [
    'sorties',
    'courses',
    'essences',
    'achats exceptionnels'
  ];

  protected expenses: Expense[] = [];
  protected loading = false;
  protected errorMessage = '';

  protected estimateLoading = false;
  protected estimateErrorMessage = '';
  protected monthlyEstimate: MonthlyEstimate | null = null;

  protected newExpense: ExpenseCreateInput = {
    amount: 0,
    place: '',
    expense_date: '',
    category: 'sorties'
  };

  protected editingId: number | null = null;
  protected editModel: ExpenseUpdateInput | null = null;

  protected sortKey: SortKey = 'date';
  protected sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private expenseService: ExpenseService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadExpenses();
      this.loadMonthlyEstimate();
    }
  }

  protected reloadEstimate(): void {
    this.loadMonthlyEstimate();
  }

  protected reloadExpenses(): void {
    this.loadExpenses();
  }

  protected loadExpenses(): void {
    this.loading = true;
    this.errorMessage = '';

    this.expenseService.getExpenses()
      .pipe(
        timeout({ first: 10000 }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.expenses = response.data ?? [];
        },
        error: () => {
          this.errorMessage = 'Impossible de charger les depenses.';
        }
      });
  }

  protected loadMonthlyEstimate(): void {
    this.estimateLoading = true;
    this.estimateErrorMessage = '';

    this.expenseService.getMonthlyEstimate()
      .pipe(
        timeout({ first: 10000 }),
        finalize(() => {
          this.estimateLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.monthlyEstimate = response.data ?? null;
        },
        error: () => {
          this.estimateErrorMessage = 'Impossible de charger l\'estimation.';
        }
      });
  }

  protected createExpense(): void {
    if (!this.newExpense.place || !this.newExpense.expense_date) {
      this.errorMessage = 'Merci de renseigner le lieu et la date.';
      return;
    }

    this.errorMessage = '';

    this.expenseService.createExpense(this.newExpense).subscribe({
      next: (response) => {
        if (response.data) {
          this.expenses = [response.data, ...this.expenses];
          this.newExpense = {
            amount: 0,
            place: '',
            expense_date: '',
            category: 'sorties'
          };
          this.loadMonthlyEstimate();
        }
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la creation de la depense.';
      }
    });
  }

  protected startEdit(expense: Expense): void {
    if (!expense.id) {
      return;
    }

    this.editingId = expense.id;
    this.editModel = {
      id: expense.id,
      amount: expense.amount,
      place: expense.place,
      expense_date: expense.expense_date,
      category: expense.category
    };
  }

  protected cancelEdit(): void {
    this.editingId = null;
    this.editModel = null;
  }

  protected saveEdit(): void {
    if (!this.editModel) {
      return;
    }

    this.expenseService.updateExpense(this.editModel).subscribe({
      next: (response) => {
        const updated = response.data;
        if (!updated || updated.id == null) {
          this.errorMessage = 'Reponse invalide lors de la mise a jour.';
          return;
        }

        this.expenses = this.expenses.map((expense) =>
          expense.id === updated.id ? updated : expense
        );

        this.cancelEdit();
        this.loadMonthlyEstimate();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la mise a jour.';
      }
    });
  }

  protected deleteExpense(expense: Expense): void {
    if (!expense.id) {
      return;
    }

    if (!confirm('Supprimer cette depense ?')) {
      return;
    }

    this.expenseService.deleteExpense(expense.id).subscribe({
      next: () => {
        this.expenses = this.expenses.filter((item) => item.id !== expense.id);
        this.loadMonthlyEstimate();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la suppression.';
      }
    });
  }

  protected formatDate(value: string): string {
    if (!value) {
      return '';
    }

    const parts = value.split('-');
    if (parts.length === 3) {
      const [year, month, dayWithTime] = parts;
      const day = dayWithTime.split('T')[0];
      return `${day}-${month}-${year}`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString('fr-FR');
  }

  protected toggleSort(key: SortKey): void {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      return;
    }

    this.sortKey = key;
    this.sortDirection = 'asc';
  }

  protected isSortedBy(key: SortKey): boolean {
    return this.sortKey === key;
  }

  protected getSortIcon(key: SortKey): string {
    if (this.sortKey !== key) {
      return 'unfold_more';
    }

    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  protected get sortedExpenses(): Expense[] {
    const items = [...this.expenses];
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
