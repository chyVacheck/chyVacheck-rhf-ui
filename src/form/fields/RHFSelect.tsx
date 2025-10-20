/**
 * @file RHFSelect.tsx
 * @module shared/ui/form/fields
 *
 * @description Single-select на базе shadcn/ui Select + RHF.
 * Поддерживает: лейбл (required/optional), описание, ошибки RHF/Zod,
 * левую иконку (size-4), кнопку очистки. Обёртка: 'relative min-h-10'.
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@shadcn";
import {
  FieldLabel,
  FieldDescription,
  ClearButton,
  FieldError,
} from "@form/parts";
import { DeletionValuesMap } from "@utils/constants";
import { type TDeletionValuesKey } from "@ui-types/DeletionValues";

type Option = {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
};

type NativeTriggerProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "name" | "value" | "onChange" | "onBlur" | "type"
>;

export interface RHFSelectProps<TFieldValues extends FieldValues = FieldValues>
  extends NativeTriggerProps {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
  label?: React.ReactNode;
  required?: boolean;
  requiredLabel?: boolean;
  optionalLabel?: boolean;
  id?: string;
  description?: React.ReactNode;
  wrapperClassName?: string;
  /** Плейсхолдер, показывается, когда value пустой */
  placeholder?: React.ReactNode;
  /** Массив опций. Можно также прокинуть собственных детей через childrenItems */
  options?: Option[];
  /** Если хочешь полностью кастомный список — прокинь свои <SelectItem> в childrenItems */
  childrenItems?: React.ReactNode;
  /** Левая иконка внутри триггера. Рекомендуется использовать lucide с className="size-4" */
  leftIcon?: React.ReactNode;
  /** Показать кнопку очистки значения */
  withClearButton?: boolean;
  /** Что писать в форму при пустом значении */
  emptyAs?: TDeletionValuesKey;
  /** aria-label, если нет текстового label */
  ariaLabel?: string;
}

export function RHFSelect<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  label,
  required = false,
  requiredLabel = false,
  optionalLabel = false,
  id,
  description,
  wrapperClassName,
  placeholder = "Select...",
  options,
  childrenItems,
  leftIcon,
  withClearButton = true,
  emptyAs = "undefined",
  ariaLabel,
  disabled,
  className,
  ...triggerProps
}: RHFSelectProps<TFieldValues>) {
  const ctx = useFormContext<TFieldValues>();
  const effectiveControl = control ?? ctx?.control;
  if (!effectiveControl) {
    throw new Error(
      "[RHFSelect] control is missing (provide prop or wrap with FormProvider)."
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

        // значение из формы (может быть string | undefined)
        const formValue: string | undefined = field.value ?? undefined;

        // значение, которое отдаём в Select (ВСЕГДА строка)
        const selectValue: string =
          formValue !== undefined ? String(formValue) : "";

        // Отступы: слева под иконку, справа под шеврон и крестик
        const hasLeftIcon = !!leftIcon;

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

            {/* Обёртка строго по твоему требованию */}
            <div className="relative min-h-10 w-full">
              {/* Левая иконка */}
              {hasLeftIcon && (
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {/* Просьба: передавай сюда иконку с className="size-4" */}
                  {leftIcon}
                </span>
              )}

              <Select
                required={required}
                disabled={disabled}
                // ВАЖНО: всегда строка; '' означает "ничего не выбрано"
                value={selectValue}
                onValueChange={(val: string) => field.onChange(val)}
              >
                <SelectTrigger
                  id={inputId}
                  aria-label={label ? undefined : ariaLabel}
                  aria-invalid={hasError || undefined}
                  aria-errormessage={hasError ? msgId : undefined}
                  aria-describedby={
                    !hasError && description ? descId : undefined
                  }
                  className={cn(
                    "w-full min-h-10",
                    {
                      // даём место под иконку слева
                      "pl-8": hasLeftIcon,
                      // красная обводка/текст при ошибке можно оставить дефолтной shadcn через data-[invalid], но подсветим текст
                      "text-red-500 border-red-300": hasError,
                    },
                    className
                  )}
                  {...triggerProps}
                >
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>

                <SelectContent>
                  {childrenItems
                    ? childrenItems
                    : options?.map((opt) => (
                        <SelectItem
                          key={String(opt.value)}
                          value={String(opt.value)}
                          disabled={opt.disabled}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>

              {/* Кнопка очистки значения.
                 В shadcn Select у триггера уже есть шеврон справа,
                 поэтому смещаем крестик левее шеврона. */}
              {withClearButton && (
                <ClearButton
                  className="right-8"
                  visible={!!formValue && !disabled}
                  onClear={() => field.onChange(DeletionValuesMap[emptyAs])}
                />
              )}
            </div>

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
