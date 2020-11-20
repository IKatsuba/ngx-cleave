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
import Cleave from 'cleave.js';

/**
 * Forced casting to boolean type
 * @param value
 */
export function coerceBooleanProperty(value: any): boolean {
  return value != null && `${value}` !== 'false';
}

/**
 * Forced casting to number type
 * @param value
 * @param fallbackValue
 */
export function coerceNumberProperty(value: any, fallbackValue = 0) {
  return _isNumberValue(value) ? Number(value) : fallbackValue;
}

/**
 *
 * @internal
 */
export function _isNumberValue(value: any): boolean {
  return !isNaN(parseFloat(value as any)) && !isNaN(Number(value));
}

export type CleaveMode = 'creditCard' | 'phone' | 'date' | 'time' | 'numeral';
export type CreditCardTypes =
  | 'amex'
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgxCleaveDirective),
      multi: true
    }
  ],
  exportAs: 'ngxCleave'
})
export class NgxCleaveDirective
  implements OnInit, OnDestroy, ControlValueAccessor, OnChanges {
  private static ignoredProperties = ['emitRawValue'];
  /**
   * Triggered after credit card type changes.
   * The unique argument type is the type of the detected credit
   */
  @Output('ngxCleaveCreditCardTypeChanged')
  creditCardTypeChanged = new EventEmitter<CreditCardTypes>();

  /**
   * A mode of Cleave.js
   */
  @Input('ngxCleave') public mode: CleaveMode;

  /**
   * A String value indicates the country region code for phone number formatting.
   * You can find your country code in [ISO 3166-1 alpha-2]{@link https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements} list.
   */
  @Input('ngxCleavePhoneRegionCode') phoneRegionCode = 'AU';

  /**
   * An Array value indicates the date pattern.
   * Since it's an input field, leading 0 before date and month is required. To indicate what patterns it should apply, you can use: 'Y', 'y', 'm' and 'd'.
   */
  @Input('ngxCleaveDatePattern') datePattern: DatePattern = ['d', 'm', 'Y'];

  /**
   * An date String value indicates the min date boundary.
   * The date string format follows as ISO 8601 date format YYYY-MM-DD
   */
  @Input('ngxCleaveDateMin') dateMin: string;

  /**
   * An date String value indicates the max date boundary.
   * The date string format follows as ISO 8601 date format YYYY-MM-DD
   */
  @Input('ngxCleaveDateMax') dateMax: string;

  /**
   * An Array value indicates the time pattern.
   * Since it's an input field, leading 0 before hour, minute and second is required. To indicate what patterns it should apply, you can use: 'h', 'm' and 's'.
   */
  @Input('ngxCleaveTimePattern') timePattern: TimePattern = ['h', 'm', 's'];

  /**
   * A String value indicates time format
   */
  @Input('ngxCleaveTimeFormat') timeFormat: TimeFormat = '12';

  /**
   * A String value indicates the thousands separator grouping style.
   * It accepts three preset value:
   * - thousand: Thousand numbering group style. It groups numbers in thousands and the delimiter occurs every 3 digits. 1,234,567.89
   * - lakh: Indian numbering group style. It groups the rightmost 3 digits in a similar manner to regular way but then groups every 2 digits thereafter. 12,34,567.89
   * - wan: Chinese numbering group style. It groups numbers in 10-thousand(万, 萬) and the delimiter occurs every 4 digits. 123,4567.89
   * - none: Does not group thousands. 1234567.89
   */
  @Input('ngxCleaveNumeralThousandsGroupStyle')
  numeralThousandsGroupStyle: NumeralThousandsGroupStyle = 'thousand';

  /**
   * A String value indicates the numeral decimal mark.
   * Decimal mark can be different in handwriting, and for delimiter as well.
   */
  @Input('ngxCleaveNumeralDecimalMark') numeralDecimalMark = '.';

  /**
   * An Array value indicates the groups to format the input value. It will insert delimiters in between these groups.
   * This option is ignored by creditCard, phone, date and numeral shortcuts mode.
   */
  @Input('ngxCleaveBlocks') blocks: number[];

  /**
   * A String value indicates the delimiter to use in formatting.
   */
  @Input('ngxCleaveDelimiter') delimiter: string;

  /**
   * An Array value indicates the multiple delimiters to use in formatting.
   * This option is ignored by creditCard, phone, date and numeral shortcuts mode.
   * When delimiters array is defined, single delimiter option is ignored.
   */
  @Input('ngxCleaveDelimiters') delimiters: string[];

  /**
   * A String value indicates the prepend string. It can't be removed or changed in the input field.
   */
  @Input('ngxCleavePrefix') prefix: string;
  private cleave: Cleave;

  /**
   * @internal
   */
  constructor(
    private elementRef: ElementRef<HTMLInputElement>,
    @Inject(PLATFORM_ID) private platformId,
    private renderer: Renderer2
  ) {}

  private _lowercase = false;

  /**
   * A Boolean value indicates if it converts value to lowercase letters.
   * lowercase doesn't work on it's own, you have to either specify the shortcuts mode or blocks option to enable the formatter.
   */
  @Input('ngxCleaveLowercase')
  get lowercase(): boolean {
    return this._lowercase;
  }

  set lowercase(value: boolean) {
    this._lowercase = value;
  }

  private _uppercase = false;

  /**
   * A Boolean value indicates if it converts value to uppercase letters.
   * uppercase doesn't work on it's own, you have to either specify the shortcuts mode or blocks option to enable the formatter.
   */
  @Input('ngxCleaveUppercase')
  get uppercase(): boolean {
    return this._uppercase;
  }

  set uppercase(value: boolean) {
    this._uppercase = value;
  }

  private _numericOnly = false;

  /**
   * A Boolean value indicates if it only allows numeric letters (0-9).
   * Ignored by creditCard and date shortcuts mode, the value will always be true.
   * numericOnly doesn't work on it's own, you have to either specify the shortcuts mode or blocks option to enable the formatter.
   */
  @Input('ngxCleaveNumericOnly')
  get numericOnly(): boolean {
    return this._numericOnly;
  }

  set numericOnly(value: boolean) {
    this._numericOnly = value;
  }

  private _rawValueTrimPrefix = false;

  /**
   * A Boolean value indicates if to trim prefix in calling getRawValue() or getting rawValue in AngularJS or ReactJS component.
   */
  @Input('ngxCleaveRawValueTrimPrefix')
  get rawValueTrimPrefix(): boolean {
    return this._rawValueTrimPrefix;
  }

  set rawValueTrimPrefix(value: boolean) {
    this._rawValueTrimPrefix = coerceBooleanProperty(value);
  }

  private _noImmediatePrefix = false;

  /**
   * A boolean value that if true, will only add the prefix once the user enters values. Useful if you need to use placeholders.
   */
  @Input('ngxCleaveNoImmediatePrefix')
  get noImmediatePrefix(): boolean {
    return this._noImmediatePrefix;
  }

  set noImmediatePrefix(value: boolean) {
    this._noImmediatePrefix = coerceBooleanProperty(value);
  }

  private _delimiterLazyShow = false;

  /**
   * A boolean value that if true, will lazy add the delimiter only when the user starting typing the next group section
   * This option is ignored by phone, and numeral shortcuts mode.
   */
  @Input('ngxCleaveDelimiterLazyShow')
  get delimiterLazyShow(): boolean {
    return this._delimiterLazyShow;
  }

  set delimiterLazyShow(value: boolean) {
    this._delimiterLazyShow = coerceBooleanProperty(value);
  }

  private _stripLeadingZeroes = true;

  /**
   * A Boolean value indicates if zeroes appearing at the beginning of the number should be stripped out.
   * This also prevents a number like "100,000" to disappear if the leading "1" is deleted.
   */
  @Input('ngxCleaveStripLeadingZeroes')
  get stripLeadingZeroes(): boolean {
    return this._stripLeadingZeroes;
  }

  set stripLeadingZeroes(value: boolean) {
    this._stripLeadingZeroes = coerceBooleanProperty(value);
  }

  private _signBeforePrefix = false;

  /**
   * A Boolean value indicates if the sign of the numeral should appear before the prefix.
   */
  @Input('ngxCleaveSignBeforePrefix')
  get signBeforePrefix(): boolean {
    return this._signBeforePrefix;
  }

  set signBeforePrefix(value: boolean) {
    this._signBeforePrefix = coerceBooleanProperty(value);
  }

  private _numeralPositiveOnly = false;

  /**
   * A Boolean value indicates if it only allows positive numeral value
   */
  @Input('ngxCleaveNumeralPositiveOnly')
  get numeralPositiveOnly(): boolean {
    return this._numeralPositiveOnly;
  }

  set numeralPositiveOnly(value: boolean) {
    this._numeralPositiveOnly = coerceBooleanProperty(value);
  }

  private _numeralDecimalScale = 2;

  /**
   * An Int value indicates the numeral integer scale.
   */
  @Input('ngxCleaveNumeralDecimalScale')
  get numeralDecimalScale(): number {
    return this._numeralDecimalScale;
  }

  set numeralDecimalScale(value: number) {
    this._numeralDecimalScale = coerceNumberProperty(value, 2);
  }

  private _numeralIntegerScale;

  /**
   * An Int value indicates the numeral decimal scale.
   */
  @Input('ngxCleaveNumeralIntegerScale')
  get numeralIntegerScale(): number {
    return this._numeralIntegerScale;
  }

  set numeralIntegerScale(value: number) {
    this._numeralIntegerScale = coerceNumberProperty(value, undefined);
  }

  private _creditCardStrictMode = false;

  /**
   * A Boolean value indicates if enable credit card strict mode.
   * Expand use of 19-digit PANs for supported credit card.
   */
  @Input('ngxCleaveCreditCardStrictMode')
  get creditCardStrictMode(): boolean {
    return this._creditCardStrictMode;
  }

  set creditCardStrictMode(value: boolean) {
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
      this.renderer.setAttribute(
        this.elementRef.nativeElement,
        'disabled',
        'disabled'
      );
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
    const changedProperties = Object.keys(changes).filter(
      name => !NgxCleaveDirective.ignoredProperties.includes(name)
    );

    if (
      changedProperties.length &&
      !Object.values(changes).every(event => event.firstChange)
    ) {
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
          onCreditCardTypeChanged: (type: CreditCardTypes) =>
            this.creditCardTypeChanged.emit(type)
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

  private touch = () => {};

  private change = (_: any) => {};
}
