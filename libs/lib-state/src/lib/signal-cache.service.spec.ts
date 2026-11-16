import { TestBed } from '@angular/core/testing';
import { of, throwError, delay } from 'rxjs';
import { SignalCache } from './signal-cache.service';

describe('SignalCache', () => {
  let cache: SignalCache;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    cache = TestBed.inject(SignalCache);
  });
  it('stores and invalidates a typed entry', () => {
    cache.set('x', [1, 2], 1000);
    expect(cache.peek<number[]>('x')).toEqual([1, 2]);
    cache.invalidate('x');
    expect(cache.peek('x')).toBeUndefined();
  });
  it('deduplicates concurrent loads', async () => {
    let calls = 0;
    const factory = () => { calls++; return of([1, 2]).pipe(delay(0)); };
    const [a, b] = await Promise.all([
      cache.getOrLoad('x', factory), cache.getOrLoad('x', factory),
    ]);
    expect(a).toEqual(b);
    expect(calls).toBe(1);
  });
  it('does not cache a failed response', async () => {
    await expect(cache.getOrLoad('x', () => throwError(() => Error('failed')))).rejects.toThrow();
    expect(cache.peek('x')).toBeUndefined();
  });
});
