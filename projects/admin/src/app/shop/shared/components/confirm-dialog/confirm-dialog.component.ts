import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ConfirmRequest, ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: false,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {
  open = false;
  current: ConfirmRequest | null = null;
  private sub?: Subscription;

  constructor(private confirmService: ConfirmService) {}

  ngOnInit(): void {
    this.sub = this.confirmService.requests$.subscribe((req) => {
      this.current = req;
      this.open = true;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  confirm(): void {
    this.current?.resolve(true);
    this.close();
  }

  cancel(): void {
    this.current?.resolve(false);
    this.close();
  }

  private close(): void {
    this.open = false;
    this.current = null;
  }
}
