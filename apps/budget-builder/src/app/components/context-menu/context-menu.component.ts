import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, Input, OnInit, Output, signal, WritableSignal } from '@angular/core';

@Component({
  selector: 'app-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css'],
  imports: [CommonModule],
})
export class ContextMenuComponent implements OnInit {
  @Input() contextMenu: WritableSignal<{ isShown: boolean; data: any }> = signal({ isShown: false, data: null });

  @Output() cloneValueEvent: EventEmitter<any> = new EventEmitter<any>();

  constructor() {
    effect(() => {
      const contextMenu = this.contextMenu();
      const event = contextMenu.data?.event;
      const menu = document.getElementById('contextMenu') as HTMLElement;
      if (!contextMenu.isShown) {
        this.contextMenu.update((contextMenu) => {
          contextMenu.isShown = false;
          return contextMenu;
        });
      } else {
        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;

        // Determine position for the menu
        let posX = event.pageX;
        let posY = event.pageY;

        // Check if the menu goes beyond the right edge of the window
        if (posX + menuWidth > window.innerWidth) {
          posX = window.innerWidth - menuWidth;
        }

        // Check if the menu goes beyond the bottom edge of the window
        if (posY + menuHeight > window.innerHeight) {
          posY = window.innerHeight - menuHeight;
        }

        // Set the position of the menu
        menu.style.left = posX + 'px';
        menu.style.top = posY + 'px';

        this.contextMenu.update((contextMenu) => {
          contextMenu.isShown = true;
          return contextMenu;
        });
      }
    });
  }

  ngOnInit(): void {
    document.onclick = () => {
      this.contextMenu.update((contextMenu) => {
        contextMenu.isShown = false;
        return contextMenu;
      });
    };
  }

  /**
   * Apply the current cell's value to all other values
   */
  applyToAll() {
    this.cloneValueEvent.emit(this.contextMenu().data);
    this.contextMenu.update((contextMenu) => {
      contextMenu.isShown = false;
      return contextMenu;
    });
  }
}
