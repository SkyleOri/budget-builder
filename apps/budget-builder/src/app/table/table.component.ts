import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, computed, effect, Input, signal, WritableSignal } from '@angular/core';
import { MONTH_OPTIONS } from '../constants/datetime';
import { DateTime } from 'luxon';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { ContextMenuComponent } from '../components/context-menu/context-menu.component';

const FORM_PARAMS = {
  LABEL: 'label',
  VALUE: 'value',
  TYPE: 'type',
  ITEMS: 'items',
  TOTALS: 'total',
};

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ContextMenuComponent],
})
export class TableComponent implements AfterViewInit {
  @Input() startMonth: WritableSignal<any> = signal(null);

  @Input() endMonth: WritableSignal<any> = signal(null);

  months: WritableSignal<any[]> = signal([]);

  monthLabels = computed(() => {
    const options = structuredClone(MONTH_OPTIONS);
    return this.months().map(
      (m) =>
        `${options
          .find((p) => p.value === m)
          ?.label?.split('-')?.[1]
          .trim()} ${DateTime.now().year}`
    );
  });

  incomesForm!: FormGroup;

  expensesForm!: FormGroup;

  profitLossValues: WritableSignal<any[]> = signal([]);

  openingBalanceValues: WritableSignal<any[]> = signal([]);

  closingBalanceValues: WritableSignal<any[]> = signal([]);

  FORM_PARAMS = FORM_PARAMS;

  contextMenu: WritableSignal<{ isShown: boolean; data: any }> = signal({ isShown: false, data: null });

  constructor(private fb: FormBuilder) {
    effect(() => {
      const startMonth = this.startMonth();
      const endMonth = this.endMonth();
      const results: any[] = [];
      for (let month = startMonth; month <= endMonth; month++) {
        results.push(month);
      }
      this.months.set(results);
      this.init();
    });
  }

  ngAfterViewInit() {
    this.init();
  }

  /**
   * Init forms and default values
   */
  init() {
    const createItemFormGroups = () => {
      return this.months().map((p) => {
        const itemFormGroup = this.fb.group({
          [FORM_PARAMS.LABEL]: [p],
          [FORM_PARAMS.VALUE]: [null],
        });
        return itemFormGroup;
      });
    };
    const createInitSubGroup = (itemName: string) => {
      return this.fb.group({
        [FORM_PARAMS.LABEL]: [`Sub-${itemName.toLowerCase()}`],
        [FORM_PARAMS.TYPE]: 'category',
        [FORM_PARAMS.TOTALS]: this.fb.array(createItemFormGroups()),
        [FORM_PARAMS.ITEMS]: this.fb.array([]),
      });
    };
    // Init forms
    const firstIncomeSubGroup = createInitSubGroup('Income');
    this.incomesForm = this.fb.group({
      [FORM_PARAMS.LABEL]: ['Incomes'],
      [FORM_PARAMS.TOTALS]: this.fb.array(createItemFormGroups()),
      [FORM_PARAMS.ITEMS]: this.fb.array([firstIncomeSubGroup]),
    });
    const firstExpenseSubGroup = createInitSubGroup('Expense');
    this.expensesForm = this.fb.group({
      [FORM_PARAMS.LABEL]: ['Expenses'],
      [FORM_PARAMS.TOTALS]: this.fb.array(createItemFormGroups()),
      [FORM_PARAMS.ITEMS]: this.fb.array([firstExpenseSubGroup]),
    });
    // Init first rows
    this.createItem('Income', 'category', firstIncomeSubGroup, this.incomesForm);
    this.createItem('Expense', 'category', firstExpenseSubGroup, this.expensesForm);
    // Setup basic arrays
    this.profitLossValues.set(this.months().map(() => null));
    this.openingBalanceValues.set(this.months().map(() => null));
    this.closingBalanceValues.set(this.months().map(() => null));
    // First focus cell
    (document.getElementsByClassName('data-cell')?.[0] as HTMLInputElement)?.focus();
  }

  /**
   * Get category label
   * @param itemName
   * @param type
   * @param formGroup
   * @returns
   */
  getCategoryLabel(itemName: string, type: any, formGroup: FormGroup) {
    switch (type) {
      case 'header': {
        return itemName;
      }
      case 'category': {
        return formGroup.get(FORM_PARAMS.LABEL)?.value;
      }
      default: {
        return '';
      }
    }
  }

  /**
   * Get child type
   * @param type
   * @returns
   */
  getChildType(type: string) {
    switch (type) {
      case 'header': {
        return 'category';
      }
      case 'category': {
        return 'item';
      }
      default: {
        return '';
      }
    }
  }

  /**
   * Create new item
   * @param itemName
   * @param parentType
   * @param formGroup
   * @param rootFormGroup
   */
  createItem(itemName: string, parentType: any, formGroup: FormGroup, rootFormGroup?: FormGroup) {
    const itemFormGroups = this.months().map((p) => {
      const itemFormGroup = this.fb.group({
        [FORM_PARAMS.LABEL]: [p],
        [FORM_PARAMS.VALUE]: [null],
      });
      return itemFormGroup;
    });
    switch (parentType) {
      case 'header': {
        const newControl = this.fb.group({
          [FORM_PARAMS.LABEL]: [`Sub-${itemName.toLowerCase()}`],
          [FORM_PARAMS.TYPE]: 'category',
          [FORM_PARAMS.TOTALS]: this.fb.array(itemFormGroups),
          [FORM_PARAMS.ITEMS]: this.fb.array([]),
        });
        this.createItem(itemName, 'category', newControl, rootFormGroup);
        (formGroup.get(FORM_PARAMS.ITEMS) as FormArray)?.push(newControl);
        break;
      }
      case 'category': {
        const newControl = this.fb.group({
          [FORM_PARAMS.LABEL]: [''],
          [FORM_PARAMS.TYPE]: 'item',
          [FORM_PARAMS.ITEMS]: this.fb.array(itemFormGroups),
        });
        itemFormGroups.forEach((itemFormGroup, index) => {
          itemFormGroup
            .get(FORM_PARAMS.VALUE)
            ?.valueChanges.pipe(debounceTime(300))
            .subscribe(() => {
              // Sub-group calculation
              let subGroupResult = 0;
              (formGroup?.get(FORM_PARAMS.ITEMS) as FormArray).controls.forEach((itemGroups) => {
                subGroupResult += (itemGroups?.get(FORM_PARAMS.ITEMS) as FormArray).at(index)?.get(FORM_PARAMS.VALUE)?.value || 0;
              });
              const subGroupTotalByIndex = (formGroup?.get(FORM_PARAMS.TOTALS) as FormArray).at(index) as FormGroup;
              subGroupTotalByIndex.get(FORM_PARAMS.VALUE)?.setValue(subGroupResult);
              // Group calculation
              let groupResult = 0;
              (rootFormGroup?.get(FORM_PARAMS.ITEMS) as FormArray).controls.forEach((subGroups) => {
                groupResult += (subGroups?.get(FORM_PARAMS.TOTALS) as FormArray).at(index)?.get(FORM_PARAMS.VALUE)?.value || 0;
              });
              const groupTotalByIndex = (rootFormGroup?.get(FORM_PARAMS.TOTALS) as FormArray).at(index) as FormGroup;
              groupTotalByIndex.get(FORM_PARAMS.VALUE)?.setValue(groupResult);
              // Update other calculations
              this.updateOtherCalculations(index);
            });
        });
        (formGroup.get(FORM_PARAMS.ITEMS) as FormArray)?.push(newControl);
        break;
      }
      default: {
        break;
      }
    }
    formGroup.updateValueAndValidity();
  }

  /**
   * Update global calculations
   * @param columnIndex
   */
  updateOtherCalculations(columnIndex: number) {
    // Only update for the related column
    this.profitLossValues.update((profitLossValues) => {
      profitLossValues[columnIndex] =
        ((this.incomesForm.get(FORM_PARAMS.TOTALS) as FormArray).at(columnIndex).get(FORM_PARAMS.VALUE)?.value || 0) -
        ((this.expensesForm.get(FORM_PARAMS.TOTALS) as FormArray).at(columnIndex).get(FORM_PARAMS.VALUE)?.value || 0);
      return profitLossValues;
    });
    // Update balances
    const profitLossValues = this.profitLossValues();
    const openingBalanceValues = this.openingBalanceValues();
    const closingBalanceValues = this.closingBalanceValues();
    for (let index = columnIndex; index < this.months().length; index++) {
      openingBalanceValues[index] = index !== 0 ? closingBalanceValues[index - 1] : 0;
      closingBalanceValues[index] = index !== 0 ? profitLossValues[index] + openingBalanceValues[index] : profitLossValues[0];
    }
    this.openingBalanceValues.set(openingBalanceValues);
    this.closingBalanceValues.set(closingBalanceValues);
  }

  /**
   * Check cell's keypress event
   * @param event
   * @param itemName
   * @param formGroup
   * @param rootFormGroup
   * @param colIndex
   */
  checkCellKeypressEvent(event: KeyboardEvent, itemName: string, formGroup: FormGroup, rootFormGroup: FormGroup, colIndex: number) {
    switch (event.key) {
      case 'Tab': {
        if (colIndex === this.months().length) {
          this.handleArrowKeypressEvent({ key: 'Default' } as any, 0);
          this.handleArrowKeypressEvent({ key: 'ArrowDown' } as any, colIndex);
        }
        break;
      }
      case 'Enter': {
        // if (colIndex === this.months().length) {
        event?.preventDefault?.();
        this.createItem(itemName, 'category', formGroup, rootFormGroup);
        // }
        break;
      }
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight': {
        this.handleArrowKeypressEvent(event, colIndex);
        break;
      }
      default: {
        break;
      }
    }
  }

  /**
   * Handle arrow's keypress event
   * @param event
   * @param colIndex
   */
  handleArrowKeypressEvent(event: KeyboardEvent, colIndex: number) {
    const target = event.target as HTMLInputElement;
    let tdElement = null;
    let trElement = null;
    if (!!target) {
      tdElement = target.parentElement;
      trElement = tdElement?.parentElement;
    }
    switch (event.key) {
      case 'ArrowUp': {
        event?.preventDefault?.();
        if (!!trElement && !!trElement.previousElementSibling) {
          const previousTrElement = trElement.previousElementSibling;
          const element = previousTrElement.children?.[colIndex]?.getElementsByTagName('input')?.[0];
          if (!!element) {
            (element as HTMLInputElement).focus();
          }
        }
        break;
      }
      case 'ArrowDown': {
        event?.preventDefault?.();
        if (!!trElement && !!trElement.nextElementSibling) {
          const nextTrElement = trElement.nextElementSibling;
          const element = nextTrElement.children?.[colIndex]?.getElementsByTagName('input')?.[0];
          if (!!element) {
            (element as HTMLInputElement).focus();
          }
        }
        break;
      }
      case 'ArrowLeft': {
        event?.preventDefault?.();
        if (!!trElement) {
          const previousElement = trElement.children?.[colIndex - 1]?.getElementsByTagName('input')?.[0];
          if (!!previousElement) {
            (previousElement as HTMLInputElement).focus();
          }
        }
        break;
      }
      case 'ArrowRight': {
        event?.preventDefault?.();
        if (!!trElement) {
          const nextElement = trElement.children?.[colIndex + 1]?.getElementsByTagName('input')?.[0];
          if (!!nextElement) {
            (nextElement as HTMLInputElement).focus();
          }
        }
        break;
      }
      default: {
        if (!!trElement) {
          const element = trElement.children?.[colIndex]?.getElementsByTagName('input')?.[0];
          if (!!element) {
            (element as HTMLInputElement).focus();
          }
        }
        break;
      }
    }
  }

  /**
   * Right click menu
   * @param event
   * @param formGroup
   * @param colIndex
   */
  handleInputRightClick(event: MouseEvent, formGroup: FormGroup, colIndex: any) {
    if (!!event && event.button === 2) {
      event.preventDefault();
      this.contextMenu.set({
        isShown: true,
        data: { event, formGroup, colIndex },
      });
    }
  }

  /**
   * clone value of a cell to other cells
   * @param data
   */
  cloneValue(data: { formGroup: FormGroup; colIndex: number }) {
    const dataRows = (data.formGroup.get(FORM_PARAMS.ITEMS) as FormArray).controls;
    const foundDataRow = dataRows?.[data.colIndex]?.get(FORM_PARAMS.VALUE);
    if (!!foundDataRow) {
      dataRows.forEach((dataRow) => {
        dataRow?.get(FORM_PARAMS.VALUE)?.setValue(foundDataRow.value);
      });
    }
  }
}
