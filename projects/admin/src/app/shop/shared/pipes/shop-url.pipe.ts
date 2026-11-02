import { Pipe, PipeTransform } from '@angular/core';
import { shopUrl } from '../../core/utils/shop-url';

/** `[routerLink]="'/dashboard' | shopUrl"` → /t/<slug>/dashboard */
@Pipe({ name: 'shopUrl', standalone: false })
export class ShopUrlPipe implements PipeTransform {
  transform(path: string): string {
    return shopUrl(path);
  }
}
