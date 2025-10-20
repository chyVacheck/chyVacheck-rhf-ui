/**
 * @file constants.ts
 * @author Dmytro Shakh
 */

import {
  type TDeletionValue,
  type TDeletionValuesKey,
} from "@ui-types/DeletionValues";

/**
 * Специальные значения для сброса/удаления полей
 */
export const DeletionValuesMap: Record<TDeletionValuesKey, TDeletionValue> = {
  null: null,
  undefined: undefined,
  "empty-string": "",
} as const;
