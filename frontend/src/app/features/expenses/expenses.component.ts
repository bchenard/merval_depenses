import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { finalize, timeout } from 'rxjs';

import { ExpenseService } from '../../core/services/expense.service';
import {
  Expense,
  ExpenseCategory,
  ExpenseCreateInput,
  ExpenseUpdateInput,
  MonthlyEstimate
} from '../../shared/models/expense.model';
import { ExpenseSortService, SortKey } from './services/expense-sort.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.css'
})
export class ExpensesComponent implements OnInit {
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

  constructor(
    private expenseService: ExpenseService,
    protected sortService: ExpenseSortService,
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
          this.newExpense = {
            amount: 0,
            place: '',
            expense_date: '',
            category: 'sorties'
          };
          // Recharger dynamiquement la liste et l'estimation
          this.loadExpenses();
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

        this.cancelEdit();
        // Recharger dynamiquement la liste et l'estimation
        this.loadExpenses();
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
        // Recharger dynamiquement la liste et l'estimation
        this.loadExpenses();
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

  protected get sortedExpenses(): Expense[] {
    if (!this.expenses || !Array.isArray(this.expenses)) {
      return [];
    }
    return this.sortService.sort(this.expenses);
  }
}


