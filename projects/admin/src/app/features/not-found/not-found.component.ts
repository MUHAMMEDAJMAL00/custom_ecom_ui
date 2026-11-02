import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  standalone: false,
  template: `
    <div class="not-found">
      <p class="code">404</p>
      <h2>Page not found</h2>
      <p>The screen you opened does not exist yet.</p>
      <a routerLink="/platform">Back to dashboard</a>
    </div>
  `,
  styles: [
    `
      .not-found {
        display: grid;
        place-items: center;
        min-height: 60vh;
        text-align: center;
      }

      .code {
        margin: 0;
        font-size: 64px;
        font-weight: 800;
        line-height: 1;
        letter-spacing: -0.06em;
        color: #c7d2fe;
      }

      h2 {
        margin: 12px 0 6px;
        font-size: 24px;
        color: #0f172a;
      }

      p {
        margin: 0 0 18px;
        font-size: 13px;
        color: #64748b;
      }

      a {
        padding: 9px 14px;
        font-size: 12px;
        font-weight: 650;
        color: #fff;
        background: #4f46e5;
        border-radius: 8px;
        text-decoration: none;
      }
    `,
  ],
})
export class NotFoundComponent {}
