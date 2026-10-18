import { TestBed } from '@angular/core/testing';
import { Card } from './card';

describe('Card', () => {
  it('renders its required heading', async () => {
    const fixture = TestBed.createComponent(Card);
    fixture.componentRef.setInput('title', 'Shared UI');
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('h2')?.textContent).toBe(
      'Shared UI',
    );
  });
});
