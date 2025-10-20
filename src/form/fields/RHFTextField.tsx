/**
 * @file RHFTextField.tsx
 * @module shared/ui/form/fields
 *
 * @description Поле ввода текста с поддержкой react-hook-form и shadcn/ui.
 * Использует наши части: FieldLabel, FieldDescription, ClearButton.
 * Показывает ошибку из RHF/Zod, скрывая описание при ошибке.
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
  "name" | "defaultValue" | "value" | "onChange" | "onBlur" | "size"
>;

export interface RHFTextFieldProps<
  TFieldValues extends FieldValues = FieldValues
> extends NativeInputProps {
  /** Имя поля (react-hook-form) */
  name: Path<TFieldValues>;
  /** Control из RHF; если не передан — возьмём из FormProvider */
  control?: Control<TFieldValues>;
  /** Заголовок/лейбл поля */
  label?: React.ReactNode;
  /** Пометка обязательности (рендерит *) — конфликтует с optional */
  requiredLabel?: boolean;
  /** Пометка необязательности (рендерит (optional)) — конфликтует с requiredLabel */
  optionalLabel?: boolean;
  /** Идентификатор поля (связывается с label и описанием) */
  id?: string;
  /** Подпись-описание под полем (скрывается при ошибке) */
  description?: React.ReactNode;
  /** Показать кнопку очистки внутри инпута */
  withClearButton?: boolean;
  /** Что писать в форму при пустом значении */
  emptyAs?: TDeletionValuesKey;
  /** Внешний класс обёртки */
  wrapperClassName?: string;
  /** Подсказка для aria-label, если нет явного label */
  ariaLabel?: string;
}

export function RHFTextField<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  label,
  requiredLabel = false,
  optionalLabel = false,
  id,
  description,
  withClearButton = true,
  emptyAs = "empty-string",
  wrapperClassName,
  ariaLabel,
  disabled,
  className,
  type = "text",
  ...inputProps
}: RHFTextFieldProps<TFieldValues>) {
  // Если Control не передан — пробуем забрать из контекста
  const ctx = useFormContext<TFieldValues>();
  const effectiveControl = control ?? ctx?.control;
  if (!effectiveControl) {
    throw new Error(
      "[RHFTextField] control is missing (provide prop or wrap with FormProvider)."
    );
  }

  const inputId = id ?? `field-${name}`;
  const descId = `${inputId}-desc`;
  const msgId = `${inputId}-msg`;

  return (
    <Controller
      control={effectiveControl}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error;
        const errorMessage = fieldState.error?.message as
          | React.ReactNode
          | undefined;

        return (
          <div className={cn("w-full", wrapperClassName)}>
            {/* Лейбл (опционально) */}
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

            {/* Контейнер для инпута и кнопки очистки */}
            <div className="relative min-h-10">
              <Input
                id={inputId}
                type={type}
                disabled={disabled}
                // A11y: если нет label — используем aria-label
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
                    "text-red-500 border-red-300": hasError,
                  },
                  className
                )}
                // RHF биндинги
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                {...inputProps}
              />

              {/* Кнопка очистки */}
              {withClearButton && (
                <ClearButton
                  visible={!!field.value && !disabled}
                  onClear={() => field.onChange(DeletionValuesMap[emptyAs])}
                />
              )}
            </div>

            {/* Описание, скрывается при ошибке */}
            <FieldDescription id={descId} error={hasError}>
              {description}
            </FieldDescription>

            <FieldError id={msgId}>{errorMessage}</FieldError>
          </div>
        );
      }}
    />
  );
}
