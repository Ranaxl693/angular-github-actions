import { Component, inject } from '@angular/core';
import { WorkspaceState } from '@workspace/lib-core';
import { Card } from '@workspace/lib-ui';

@Component({
  selector: 'app-mfe1',
  imports: [Card],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly workspace = inject(WorkspaceState);
  // Cache experiment: change only MFE1 to validate Nx affected builds.
  protected readonly products = ['Angular Handbook', 'Nx Guide', 'Native Federation Workshop'];
}
