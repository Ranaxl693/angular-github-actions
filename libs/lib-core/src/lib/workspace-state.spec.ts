import { WorkspaceState } from './workspace-state';

describe('WorkspaceState', () => {
  it('adds items and clears the shared', () => {
    const state = new WorkspaceState();
    state.addItem();
    state.addItem();
    expect(state.selectedCount()).toBe(2);
    state.clear();
    expect(state.selectedCount()).toBe(0);
  });
});
