import { Component } from '@angular/core';
import { ExpensesComponent } from './features/expenses/expenses.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ExpensesComponent],
  template: '<app-expenses></app-expenses>'
})
export class App {}
