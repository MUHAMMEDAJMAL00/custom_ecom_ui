import { Component } from '@angular/core';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(theme: ThemeService) {
    // Instantiating the service applies the saved theme before the first page renders.
    void theme;
  }
}
