import {
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  Renderer2,
  SimpleChanges
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import * as Cleave from 'cleave.js/dist/cleave.js';

export function coerceBooleanProperty(value: any): boolean {
  return value != null && `${value}` !== 'false';
}

export function coerceNumberProperty(value: any, fallbackValue = 0) {
  return _isNumberValue(value) ? Number(value) : fallbackValue;
}

export function _isNumberValue(value: any): boolean {
  return !isNaN(parseFloat(value as any)) && !isNaN(Number(value));
}

export type CleaveMode = 'creditCard' | 'phone' | 'date' | 'time' | 'numeral';
export type CreditCardTypes =
  'amex'
  | 'mastercard'
  | 'visa'
  | 'diners'
  | 'discover'
  | 'jcb'
  | 'dankort'
  | 'instapayment'
  | 'uatp'
  | 'mir'
  | 'unionPay'
  | 'unknown';

export type DatePattern = Array<'Y' | 'y' | 'm' | 'd'>;
export type TimePattern = Array<'h' | 'm' | 's'>;
export type TimeFormat = '12' | '24';
export type NumeralThousandsGroupStyle = 'thousand' | 'lakh' | 'wan' | 'none';

@Directive({
  selector: 'input[ngxCleave],textarea[ngxCleave]',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NgxCleaveDirective), multi: true }],
  exportAs: 'ngxCleave'
})
export class NgxCleaveDirective implements OnInit, OnDestroy, ControlValueAccessor, OnChanges {
  private static ignoredProperties = ['emitRawValue'];
  @Output('ngxCleaveCreditCardTypeChanged') creditCardTypeChanged = new EventEmitter<CreditCardTypes>();

  @Input('ngxCleave') public mode: CleaveMode;
  @Input('ngxCleavePhoneRegionCode') phoneRegionCode = 'AU';
  @Input('ngxCleaveDatePattern') datePattern: DatePattern = ['d', 'm', 'Y'];
  @Input('ngxCleaveDateMin') dateMin: string;
  @Input('ngxCleaveDateMax') dateMax: string;
  @Input('ngxCleaveTimePattern') timePattern: TimePattern = ['h', 'm', 's'];
  @Input('ngxCleaveTimeFormat') timeFormat: TimeFormat = '12';
  @Input('ngxCleaveNumeralThousandsGroupStyle') numeralThousandsGroupStyle: NumeralThousandsGroupStyle = 'thousand';
  @Input('ngxCleaveNumeralDecimalMark') numeralDecimalMark = '.';
  @Input('ngxCleaveBlocks') blocks: number[];
  @Input('ngxCleaveDelimiter') delimiter: string;
  @Input('ngxCleaveDelimiters') delimiters: string[];
  @Input('ngxCleavePrefix') prefix: string;
  private cleave: Cleave;

  constructor(private elementRef: ElementRef<HTMLInputElement>,
              @Inject(PLATFORM_ID) private platformId,
              private renderer: Renderer2) {
  }

  private _lowercase = false;

  @Input('ngxCleaveLowercase')
  get lowercase(): boolean {
    return this._lowercase;
  }

  set lowercase(value: boolean) {
    this._lowercase = value;
  }

  private _uppercase = false;

  @Input('ngxCleaveUppercase')
  get uppercase(): boolean {
    return this._uppercase;
  }

  set uppercase(value: boolean) {
    this._uppercase = value;
  }

  private _numericOnly = false;

  @Input('ngxCleaveNumericOnly')
  get numericOnly(): boolean {
    return this._numericOnly;
  }

  set numericOnly(value: boolean) {
    this._numericOnly = value;
  }

  private _rawValueTrimPrefix = false;

  @Input('ngxCleaveRawValueTrimPrefix')
  get rawValueTrimPrefix(): boolean {
    return this._rawValueTrimPrefix;
  }

  set rawValueTrimPrefix(value: boolean) {
    this._rawValueTrimPrefix = coerceBooleanProperty(value);
  }

  private _noImmediatePrefix = false;

  @Input('ngxCleaveNoImmediatePrefix')
  get noImmediatePrefix(): boolean {
    return this._noImmediatePrefix;
  }

  set noImmediatePrefix(value: boolean) {
    this._noImmediatePrefix = coerceBooleanProperty(value);
  }

  private _delimiterLazyShow = false;

  @Input('ngxCleaveDelimiterLazyShow')
  get delimiterLazyShow(): boolean {
    return this._delimiterLazyShow;
  }

  set delimiterLazyShow(value: boolean) {
    this._delimiterLazyShow = coerceBooleanProperty(value);
  }

  private _stripLeadingZeroes = true;

  @Input('ngxCleaveStripLeadingZeroes')
  get stripLeadingZeroes(): boolean {
    return this._stripLeadingZeroes;
  }

  set stripLeadingZeroes(value: boolean) {
    this._stripLeadingZeroes = coerceBooleanProperty(value);
  }

  private _signBeforePrefix = false;

  @Input('ngxCleaveSignBeforePrefix')
  get signBeforePrefix(): boolean {
    return this._signBeforePrefix;
  }

  set signBeforePrefix(value: boolean) {
    this._signBeforePrefix = coerceBooleanProperty(value);
  }

  private _numeralPositiveOnly = false;

  @Input('ngxCleaveNumeralPositiveOnly')
  get numeralPositiveOnly(): boolean {
    return this._numeralPositiveOnly;
  }

  set numeralPositiveOnly(value: boolean) {
    this._numeralPositiveOnly = coerceBooleanProperty(value);
  }

  private _numeralDecimalScale = 2;

  @Input('ngxCleaveNumeralDecimalScale')
  get numeralDecimalScale(): number {
    return this._numeralDecimalScale;
  }

  set numeralDecimalScale(value: number) {
    this._numeralDecimalScale = coerceNumberProperty(value, 2);
  }

  private _numeralIntegerScale;

  @Input('ngxCleaveNumeralIntegerScale')
  get numeralIntegerScale(): number {
    return this._numeralIntegerScale;
  }

  set numeralIntegerScale(value: number) {
    this._numeralIntegerScale = coerceNumberProperty(value, undefined);
  }

  private _creditCardStrictMode = false;

  @Input('ngxCleaveCreditCardStrictMode')
  get creditCardStrictMode() {
    return this._creditCardStrictMode;
  }

  set creditCardStrictMode(value) {
    this._creditCardStrictMode = coerceBooleanProperty(value);
  }

  private _emitRawValue = false;

  @Input('ngxCleaveEmitRawValue')
  get emitRawValue(): boolean {
    return this._emitRawValue;
  }

  set emitRawValue(value: boolean) {
    this._emitRawValue = coerceBooleanProperty(value);
  }

  private get isBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  @HostListener('blur')
  public onBlur() {
    this.touch();
  }

  ngOnDestroy(): void {
    if (this.cleave) {
      this.cleave.destroy();
    }
  }

  ngOnInit(): void {
    this.createCleaveInstance();
  }

  registerOnChange(fn: any): void {
    this.change = fn;
  }

  registerOnTouched(fn: any): void {
    this.touch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.renderer.setAttribute(this.elementRef.nativeElement, 'disabled', 'disabled');
    } else {
      this.renderer.removeAttribute(this.elementRef.nativeElement, 'disabled');
    }
  }

  writeValue(obj: any): void {
    if (this.isBrowser) {
      this.cleave.setRawValue(obj);
    } else {
      this.renderer.setValue(this.elementRef.nativeElement, obj);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const changedProperties = Object.keys(changes).filter(name => !NgxCleaveDirective.ignoredProperties.includes(name));

    if (changedProperties.length && !Object.values(changes).every(event => event.firstChange)) {
      this.createCleaveInstance();
    }
  }

  private createCleaveInstance() {
    if (this.cleave) {
      this.cleave.destroy();
    }

    if (this.isBrowser) {
      this.cleave = new Cleave(this.elementRef.nativeElement, {
        ...this.getCleaveConfig(),
        onValueChanged: ({ target: { rawValue, value } }): void => {
          this.change(this.emitRawValue ? rawValue : value);
        }
      });
    }
  }

  private getCleaveConfig() {
    let config = {};

    switch (this.mode) {
      case 'creditCard':
        config = {
          ...config,
          creditCard: true,
          creditCardStrictMode: this.creditCardStrictMode,
          onCreditCardTypeChanged: (type: CreditCardTypes) => this.creditCardTypeChanged.emit(type)
        };
        break;
      case 'phone':
        config = {
          ...config,
          phone: true,
          phoneRegionCode: this.phoneRegionCode
        };
        break;
      case 'date':
        config = {
          ...config,
          date: true,
          datePattern: this.datePattern,
          dateMin: this.dateMin,
          dateMax: this.dateMax
        };
        break;
      case 'time':
        config = {
          ...config,
          time: true,
          timeFormat: this.timeFormat,
          timePattern: this.timePattern
        };
        break;
      case 'numeral':
        config = {
          ...config,
          numeral: true,
          numeralThousandsGroupStyle: this.numeralThousandsGroupStyle,
          numeralIntegerScale: this.numeralIntegerScale,
          numeralDecimalScale: this.numeralDecimalScale,
          numeralDecimalMark: this.numeralDecimalMark,
          numeralPositiveOnly: this.numeralPositiveOnly,
          signBeforePrefix: this.signBeforePrefix,
          stripLeadingZeroes: this.stripLeadingZeroes
        };
        break;
    }

    config = {
      ...config,
      blocks: this.blocks,
      delimiter: this.delimiter,
      delimiters: this.delimiters,
      delimiterLazyShow: this.delimiterLazyShow,
      prefix: this.prefix,
      noImmediatePrefix: this.noImmediatePrefix,
      rawValueTrimPrefix: this.rawValueTrimPrefix,
      numericOnly: this.numericOnly,
      uppercase: this.uppercase,
      lowercase: this.lowercase
    };

    return config;
  }

  private touch = () => {
  };

  private change = (_: any) => {
  };
}
