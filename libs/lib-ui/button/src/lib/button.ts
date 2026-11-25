import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-ui-button',
  template: `<button type="button" [disabled]="disabled()" (click)="pressed.emit()">{{ label() }}</button>`,
})
export class Button {
  readonly label = input.required<string>();
  readonly disabled = input(false);
  readonly pressed = output<void>();
}
