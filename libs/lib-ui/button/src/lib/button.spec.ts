import { TestBed } from '@angular/core/testing';
import { Button } from './button';

describe('Button', () => {
  it('emits when clicked and respects disabled state', async () => {
    const fixture = TestBed.createComponent(Button);
    let clicks = 0;
    fixture.componentInstance.pressed.subscribe(() => clicks++);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    button.click();
    expect(clicks).toBe(1);
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
    button.click();
    expect(clicks).toBe(1);
  });
});
