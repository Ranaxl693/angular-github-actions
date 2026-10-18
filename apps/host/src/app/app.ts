import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { inject } from '@angular/core';
import { WorkspaceState } from '@workspace/lib-core';
import { Card } from '@workspace/lib-ui';
import { environment } from '../environments/environment';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Card],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly workspace = inject(WorkspaceState);
  protected readonly environmentName = environment.environmentName;
  protected readonly title = signal('angular-github-actions-your-mfe');
}
