import { CommonModule } from '@angular/common';
import { Component, computed, Input, signal, WritableSignal } from '@angular/core';

@Component({
  selector: 'app-month-picker',
  templateUrl: './month-picker.component.html',
  styleUrls: ['./month-picker.component.css'],
  imports: [CommonModule],
})
export class MonthPickerComponent {
  isHidden: WritableSignal<boolean> = signal(true);

  @Input() options = signal<any[]>([]);

  @Input() selectedOption = signal<any>(null);

  selectedLabel = computed(() => {
    return this.options().find((p) => p.value === this.selectedOption())?.label;
  });

  onClickOptionEvent(option: any) {
    if (option.value !== this.selectedOption() && !option.disabled) {
      this.selectedOption.set(option.value);
      this.isHidden.set(true);
    }
  }
}
