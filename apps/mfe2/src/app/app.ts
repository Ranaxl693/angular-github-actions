import { Component, inject } from '@angular/core';
import { WorkspaceState } from '@workspace/lib-core';
import { Card } from '@workspace/lib-ui';

@Component({
  selector: 'app-mfe2',
  imports: [Card],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly workspace = inject(WorkspaceState);
  title: string = 'MFE2';
}
