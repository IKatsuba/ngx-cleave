import { NgxCleaveDirective } from './ngx-cleave.directive';
import { ElementRef, Renderer2, RendererFactory2 } from '@angular/core';
import { async, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

describe('NgxCleaveDirective', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [
        {
          provide: NgxCleaveDirective,
          useClass: NgxCleaveDirective
        },
        {
          provide: ElementRef,
          useValue: new ElementRef<HTMLInputElement>(
            document.createElement('input')
          )
        },
        {
          provide: Renderer2,
          useFactory: function getRenderer(
            rendererFactory: RendererFactory2
          ): Renderer2 {
            return rendererFactory.createRenderer(null, null);
          },
          deps: [RendererFactory2]
        }
      ]
    });
  }));

  it('should create an instance', () => {
    const directive = TestBed.get(NgxCleaveDirective);
    expect(directive).toBeTruthy();
  });
});
