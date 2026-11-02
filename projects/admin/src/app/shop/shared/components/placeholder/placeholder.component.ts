import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: false,
  templateUrl: './placeholder.component.html',
  styleUrl: './placeholder.component.css',
})
export class PlaceholderComponent implements OnInit {
  title = 'This page';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.title = this.route.snapshot.data['title'] ?? 'This page';
  }
}
