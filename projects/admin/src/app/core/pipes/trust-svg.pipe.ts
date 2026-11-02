import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/** Marks the static SVG icon markup from tenant-nav-config.ts as safe. Never use with user input. */
@Pipe({ name: 'trustSvg', standalone: false })
export class TrustSvgPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(markup: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(markup);
  }
}
