import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: false,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() saveLabel = 'Save';
  @Input() saving = false;
  @Input() showFooter = true;
  @Input() small = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saveClicked = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  triggerSave(): void {
    this.saveClicked.emit();
  }
}
