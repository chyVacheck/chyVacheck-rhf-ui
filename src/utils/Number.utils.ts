/**
 * @file Number.utils.ts
 * @module utils
 *
 * @description
 * Утилита для работы с числами.
 *
 * @author Dmytro Shakh
 */

export class NumberUtils {
  /** Паддинг до 2 символов */
  static pad2(n: number) {
    return n < 10 ? `0${n}` : String(n);
  }

  /**
   * Ограничение числа в заданном диапазоне
   * @param n Число для ограничения
   * @param min Минимальное значение (включительно)
   * @param max Максимальное значение (включительно)
   * @returns Ограниченное число
   */
  static clamp(n: number, min: number, max: number) {
    return Math.min(Math.max(n, min), max);
  }

  /** Создание массива от 0 до n-1 */
  static range(n: number) {
    return Array.from({ length: n }, (_, i) => i);
  }

  /**
   * Форматирует размер в байтах в читабельный вид с адаптивным выбором единицы измерения.
   * Пример: 1536 -> "1.5 KB", 10_485_760 -> "10 MB", 2_147_483_648 -> "2 GB".
   */
  static formatBytes(
    bytes: number,
    options: { decimals?: number; base?: 1000 | 1024 } = {}
  ): string {
    const { decimals = 2, base = 1024 } = options;
    const units = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

    // Определяем степень (единицу) так, чтобы число было удобочитаемым
    const i = Math.min(
      Math.floor(Math.log(bytes) / Math.log(base)),
      units.length - 1
    );
    const value = bytes / Math.pow(base, i);

    // Округляем, убирая лишние нули в конце
    const rounded = Number.parseFloat(value.toFixed(decimals));
    return `${rounded} ${units[i]}`;
  }
}
