/**
 * @file RHFNumberField.tsx
 * @module shared/ui/form/fields
 *
 * @description Числовое поле для react-hook-form + shadcn/ui.
 * Хранит number в форме, поддерживает min/max/step/precision,
 * замену запятой, очистку значения, и отображение ошибок RHF/Zod.
 *
 * @author Dmytro Shakh
 */

"use client";

/**
 * ! lib imports
 */
import * as React from "react";
import {
  useFormContext,
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

/**
 * ! my imports
 */
import { cn } from "@utils/lib";
import { Input } from "@shadcn";
import {
  FieldLabel,
  FieldDescription,
  ClearButton,
  FieldError,
} from "@form/parts";
import { DeletionValuesMap } from "@utils/constants";
import { type TDeletionValuesKey } from "@ui-types/DeletionValues";

type NativeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "defaultValue" | "value" | "onChange" | "onBlur" | "size" | "type"
>;

export interface RHFNumberFieldProps<
  TFieldValues extends FieldValues = FieldValues
> extends NativeInputProps {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
  label?: React.ReactNode;
  requiredLabel?: boolean;
  optionalLabel?: boolean;
  id?: string;
  description?: React.ReactNode;
  withClearButton?: boolean;
  wrapperClassName?: string;
  ariaLabel?: string;

  /** Разрешить ввод запятой, будет заменена на точку */
  acceptComma?: boolean;
  /** Кол-во знаков после запятой при блюре (undefined = не округлять) */
  precision?: number;
  /** Что писать в форму при пустом значении */
  emptyAs?: TDeletionValuesKey;
  /** Жёстко гарантировать min/max при блюре */
  clampOnBlur?: boolean;

  /** Числовые ограничения (HTML-атрибуты тоже можно передать) */
  min?: number;
  max?: number;
  step?: number;
}

// TODO добавить форматирование числа (например, с разделителем тысяч)

export function RHFNumberField<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  label,
  requiredLabel = false,
  optionalLabel = false,
  id,
  description,
  withClearButton = true,
  wrapperClassName,
  ariaLabel,
  disabled,
  className,

  acceptComma = true,
  precision,
  emptyAs = "empty-string",
  clampOnBlur = true,

  min,
  max,
  step,
  ...inputProps
}: RHFNumberFieldProps<TFieldValues>) {
  const ctx = useFormContext<TFieldValues>();
  const effectiveControl = control ?? ctx?.control;
  if (!effectiveControl) {
    throw new Error(
      "[RHFNumberField] control is missing (provide prop or wrap with FormProvider)."
    );
  }

  const inputId = id ?? `field-${name}`;
  const descId = `${inputId}-desc`;
  const msgId = `${inputId}-msg`;

  // Преобразование строки в число с учётом опций
  function toNumberOrEmpty(raw: string): number | null | undefined {
    const s = acceptComma ? raw.replace(",", ".") : raw;
    if (s.trim() === "") return emptyAs === "null" ? null : undefined;

    const n = Number(s);
    if (Number.isNaN(n)) return emptyAs === "null" ? null : undefined;
    return n;
  }

  function clamp(n: number) {
    if (typeof min === "number" && n < min) return min;
    if (typeof max === "number" && n > max) return max;
    return n;
  }

  function roundPrecision(n: number) {
    if (typeof precision !== "number") return n;
    const factor = Math.pow(10, precision);
    return Math.round(n * factor) / factor;
  }

  return (
    <Controller
      control={effectiveControl}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error;
        const errorMessage = fieldState.error?.message as
          | React.ReactNode
          | undefined;

        // Текущее значение в форме — число | null | undefined
        const current = field.value as number | null | undefined;

        // Для UI нам нужен текст:
        const displayValue =
          current === null || typeof current === "undefined"
            ? ""
            : String(current);

        return (
          <div className={cn("w-full", wrapperClassName)}>
            {label ? (
              <FieldLabel
                htmlFor={inputId}
                required={requiredLabel}
                optional={optionalLabel}
                error={hasError}
              >
                {label}
              </FieldLabel>
            ) : null}

            <div className="relative min-h-10">
              <Input
                id={inputId}
                type="number"
                inputMode="decimal"
                step={step}
                min={min}
                max={max}
                disabled={disabled}
                value={displayValue}
                onChange={(e) => {
                  // Не даём браузеру автоматически конвертить — парсим сами
                  const next = toNumberOrEmpty(e.target.value);
                  field.onChange(next);
                }}
                onBlur={(e) => {
                  field.onBlur();

                  const nextParsed = toNumberOrEmpty(e.target.value);
                  if (typeof nextParsed === "number") {
                    // применяем округление и/или кламп
                    let next = nextParsed;
                    next = roundPrecision(next);
                    if (clampOnBlur) next = clamp(next);

                    // если precision применили — обновим текст
                    // (чтобы "1.234999" превратилось в "1.235", например)
                    if (next !== nextParsed) {
                      field.onChange(next);
                    }
                  } else {
                    // пустое — уже выставлено emptyAs
                    field.onChange(nextParsed);
                  }
                }}
                // предотвращаем прокрутку числа колёсиком
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                aria-label={label ? undefined : ariaLabel}
                aria-invalid={hasError || undefined}
                aria-errormessage={hasError ? msgId : undefined}
                aria-describedby={!hasError && description ? descId : undefined}
                className={cn(
                  "min-h-10",
                  {
                    // даём место под кнопку очистки
                    "pr-8": withClearButton,
                    // красная обводка/текст при ошибке можно оставить дефолтной shadcn через data-[invalid], но подсветим текст
                    "text-red-500": hasError,
                  },
                  className
                )}
                {...inputProps}
              />

              {withClearButton && (
                <ClearButton
                  visible={displayValue !== "" && !disabled}
                  onClear={() => field.onChange(DeletionValuesMap[emptyAs])}
                />
              )}
            </div>

            {/* Описание, скрывается при ошибке */}
            <FieldDescription id={descId} error={hasError}>
              {description}
            </FieldDescription>

            {/* Сообщение ошибки */}
            <FieldError id={msgId}>{errorMessage}</FieldError>
          </div>
        );
      }}
    />
  );
}
