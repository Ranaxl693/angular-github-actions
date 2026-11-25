import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-ui-button',
  template: `<button type="button" [disabled]="disabled()" (click)="pressed.emit()"><ng-content /></button>`,
})
export class Button {
  readonly disabled = input(false);
  readonly pressed = output<void>();
}
