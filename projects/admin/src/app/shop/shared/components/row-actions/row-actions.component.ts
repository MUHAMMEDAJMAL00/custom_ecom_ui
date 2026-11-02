import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-row-actions',
  standalone: false,
  templateUrl: './row-actions.component.html',
  styleUrl: './row-actions.component.css',
})
export class RowActionsComponent {
  @Input() showView = false;
  @Input() showEdit = false;
  @Input() showDelete = false;
  @Output() view = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
}
