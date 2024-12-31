import { Component, signal, WritableSignal } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { TableComponent } from './table/table.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [HeaderComponent, TableComponent],
})
export class AppComponent {
  startMonth: WritableSignal<any> = signal(1);
  endMonth: WritableSignal<any> = signal(12);
}
