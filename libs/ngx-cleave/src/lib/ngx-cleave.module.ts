import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxCleaveDirective } from './ngx-cleave.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [NgxCleaveDirective],
  exports: [NgxCleaveDirective]
})
export class NgxCleaveModule {
}
