import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ExpenseService,
  Expense,
  ExpenseCategory,
  ExpenseCreateInput,
  ExpenseUpdateInput
} from './expense.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
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

  protected newExpense: ExpenseCreateInput = {
    amount: 0,
    place: '',
    expense_date: '',
    category: 'sorties'
  };

  protected editingId: number | null = null;
  protected editModel: ExpenseUpdateInput | null = null;

  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  protected loadExpenses(): void {
    this.loading = true;
    this.errorMessage = '';

    this.expenseService.getExpenses().subscribe({
      next: (response) => {
        this.expenses = response.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les depenses.';
        this.loading = false;
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
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la suppression.';
      }
    });
  }
}
