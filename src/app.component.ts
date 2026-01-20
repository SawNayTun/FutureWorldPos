import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PosTerminalComponent } from './components/pos-terminal.component';
import { DashboardComponent } from './components/dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PosTerminalComponent, DashboardComponent],
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent {
  activeTab = signal<'pos' | 'dashboard'>('pos');
}