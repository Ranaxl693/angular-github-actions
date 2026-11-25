import { TestBed } from '@angular/core/testing';
import { Button } from './button';

describe('Button', () => {
  it('renders its label and emits on click', async () => {
    const fixture = TestBed.createComponent(Button);
    fixture.componentRef.setInput('label', 'Clear selection');
    let clicks = 0;
    fixture.componentInstance.pressed.subscribe(() => clicks++);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.textContent).toBe('Clear selection');
    button.click();
    expect(clicks).toBe(1);
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
    button.click();
    expect(clicks).toBe(1);
  });
});
