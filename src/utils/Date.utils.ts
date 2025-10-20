/**
 * @file Date.utils.ts
 * @module utils
 *
 * @description
 * Утилита для работы с датами и временем.
 *
 * @author Dmytro Shakh
 */

export type DateRange = {
  min?: Date; // включительно
  max?: Date; // включительно
};

/** Utility functions for work with dates */
export class DateUtils {
  static get24HourTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  static getMonthShort(m0: number, locale = "en-EN") {
    return new Intl.DateTimeFormat(locale, { month: "short" }).format(
      new Date(2000, m0, 1)
    );
  }

  /**
   * Красивое форматирование для UI через Intl (локаль — en-US по умолчанию)
   */
  static formatDateHuman(
    d: Date,
    locale = "en-US",
    opts: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }
  ): string {
    return new Intl.DateTimeFormat(locale, opts).format(d);
  }

  static isIsoDateString(value: unknown): boolean {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value);
  }

  static getDateOrNull(date: string | Date | null | undefined): Date | null {
    if (date === undefined || date === null) return null;

    return new Date(date);
  }

  // Helper: формат времени HH:mm
  static formatTime(d: Date): string {
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // Helper: формат полной даты DD.MM.YYYY HH:mm
  static formatFull(d: Date): string {
    const dd = d.getDate().toString().padStart(2, "0");
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy} ${this.formatTime(d)}`;
  }

  // Helper: сравнение только по дате (без времени)
  static dateOnly(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  static formatSmartDate(input: string | Date): string {
    const date = new Date(input);
    const now = new Date();

    const msPerDay = 24 * 60 * 60 * 1000;

    const dateDay = this.dateOnly(date).getTime();
    const nowDay = this.dateOnly(now).getTime();

    const diffDays = Math.floor((nowDay - dateDay) / msPerDay);

    if (diffDays === 0) return `today ${this.formatTime(date)}`;
    if (diffDays === 1) return `yesterday ${this.formatTime(date)}`;
    if (diffDays <= 6) return `${diffDays} days ago ${this.formatTime(date)}`;

    return this.formatFull(date);
  }

  static stripTime(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  /** true, если date ∈ [min,max] (включительно по умолчанию) */
  static isDateInRange(
    date: Date,
    range?: DateRange,
    inclusive: boolean = true
  ): boolean {
    if (!range) return true;
    const t = DateUtils.stripTime(date).getTime();
    if (range.min) {
      const minT = DateUtils.stripTime(range.min).getTime();
      if (inclusive ? t < minT : t <= minT) return false;
    }
    if (range.max) {
      const maxT = DateUtils.stripTime(range.max).getTime();
      if (inclusive ? t > maxT : t >= maxT) return false;
    }
    return true;
  }

  /** Есть ли пересечение МЕСЯЦА с диапазоном (хотя бы один день доступен) */
  static isMonthInRange(
    year: number,
    month0: number,
    range?: DateRange
  ): boolean {
    if (!range || (!range.min && !range.max)) return true;
    const first = DateUtils.stripTime(new Date(year, month0, 1));
    const last = DateUtils.stripTime(new Date(year, month0 + 1, 0));
    // Пересечение отрезков [first,last] и [min,max]
    const min = range.min ? DateUtils.stripTime(range.min) : undefined;
    const max = range.max ? DateUtils.stripTime(range.max) : undefined;
    const left = min
      ? Math.max(first.getTime(), min.getTime())
      : first.getTime();
    const right = max
      ? Math.min(last.getTime(), max.getTime())
      : last.getTime();
    return left <= right; // есть пересечение
  }

  /** Есть ли пересечение ГОДА с диапазоном (хотя бы один день доступен) */
  static isYearInRange(year: number, range?: DateRange): boolean {
    if (!range || (!range.min && !range.max)) return true;
    const first = DateUtils.stripTime(new Date(year, 0, 1));
    const last = DateUtils.stripTime(new Date(year + 1, 0, 0));
    const min = range.min ? DateUtils.stripTime(range.min) : undefined;
    const max = range.max ? DateUtils.stripTime(range.max) : undefined;
    const left = min
      ? Math.max(first.getTime(), min.getTime())
      : first.getTime();
    const right = max
      ? Math.min(last.getTime(), max.getTime())
      : last.getTime();
    return left <= right;
  }

  static getYearRange(range?: DateRange, spread: number = 50) {
    if (range?.min && range?.max) {
      return { start: range.min.getFullYear(), end: range.max.getFullYear() };
    }
    if (range?.min) {
      const y = range.min.getFullYear();
      return { start: y, end: y + spread };
    }
    if (range?.max) {
      const y = range.max.getFullYear();
      return { start: y - spread, end: y };
    }
    const now = new Date().getFullYear();
    return { start: now - spread, end: now + spread };
  }

  /** true, если ДЕНЬ запрещён: вне диапазона или попадает под кастомный предикат */
  static isDayDisabled(
    date: Date,
    range?: DateRange,
    disabledDates?: (d: Date) => boolean
  ): boolean {
    if (disabledDates?.(date)) return true;
    return !DateUtils.isDateInRange(date, range, true);
  }

  /** Вспомогательные генераторы (если нужны вне компонентов) */
  static startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  static endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }
  static addMonths(d: Date, delta: number) {
    return new Date(d.getFullYear(), d.getMonth() + delta, 1);
  }
}
