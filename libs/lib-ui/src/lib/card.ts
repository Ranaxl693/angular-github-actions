import { Component, input } from '@angular/core';

@Component({
  selector: 'app-ui-card',
  template: `
    <section class="card">
      <h2>{{ title() }}</h2>
      <ng-content />
    </section>
  `,
  styles: `
    .card {
      padding: 1.5rem;
      border: 1px solid #d8dfeb;
      border-radius: 1rem;
      background: #f2f2f2;
    }
    h2 {
      margin-top: 0;
      color: #182b49;
    }
  `,
})
export class Card {
  readonly title = input.required<string>();
}
