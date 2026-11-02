import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-drawer',
  standalone: false,
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.css',
})
export class DrawerComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() saveLabel = 'Save';
  @Input() saving = false;
  @Input() showFooter = true;
  @Output() closed = new EventEmitter<void>();
  @Output() saveClicked = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  triggerSave(): void {
    this.saveClicked.emit();
  }
}
