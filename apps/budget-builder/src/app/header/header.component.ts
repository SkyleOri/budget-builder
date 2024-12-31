import { Component, effect, Input, signal, WritableSignal } from '@angular/core';
import { MonthPickerComponent } from '../components/month-picker/month-picker.component';
import { MONTH_OPTIONS } from '../constants/datetime';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [CommonModule, MonthPickerComponent],
})
export class HeaderComponent {
  @Input() startMonth: WritableSignal<any> = signal(null);
  startMonthOptions: WritableSignal<any[]> = signal(structuredClone(MONTH_OPTIONS).map((p) => ({ ...p, disabled: false })));

  @Input() endMonth: WritableSignal<any> = signal(null);
  endMonthOptions: WritableSignal<any[]> = signal(structuredClone(MONTH_OPTIONS).map((p) => ({ ...p, disabled: false })));

  constructor() {
    effect(() => {
      const startMonth = this.startMonth();
      this.endMonthOptions.update((endMonthOptions) => {
        endMonthOptions.forEach((option) => {
          option.disabled = option.value < startMonth;
        });
        return endMonthOptions;
      });
    });
    effect(() => {
      const endMonth = this.endMonth();
      this.startMonthOptions.update((startMonthOptions) => {
        startMonthOptions.forEach((option) => {
          option.disabled = option.value > endMonth;
        });
        return startMonthOptions;
      });
    });
  }

  refresh() {
    this.startMonth.set(1);
    this.endMonth.set(12);
  }
}
