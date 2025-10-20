/**
 * @file RHFToggle.tsx
 * @module shared/ui/form/fields
 *
 * @description Toggle на базе shadcn/ui Toggle + RHF.
 * Поддерживает: лейбл (required/optional), описание, ошибки RHF/Zod,
 * левую иконку (size-4). Обёртка: 'relative min-h-10'.
 *
 * @author Dmytro Shakh
 */

"use client";

/**
 * ! lib imports
 */
import * as React from "react";
import { type VariantProps } from "class-variance-authority";
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
import { Toggle } from "@shadcn";
import { FieldLabel, FieldDescription, FieldError } from "@form/parts";
import { toggleVariants } from "@shadcn/toggle";

type Option = {
  value: string | number | boolean;
  label: React.ReactNode;
  disabled?: boolean;
};

type NativeToggleProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "name" | "value" | "onChange" | "onBlur" | "type"
>;

export interface RHFToggleProps<TFieldValues extends FieldValues = FieldValues>
  extends NativeToggleProps,
    VariantProps<typeof toggleVariants> {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
  label?: React.ReactNode;
  required?: boolean;
  requiredLabel?: boolean;
  optionalLabel?: boolean;
  id?: string;
  description?: React.ReactNode;
  wrapperClassName?: string;
  /** Опция, которая будет отображены как включенная. */
  enableOption: Option;
  /** Опция, которая будет отображены как выключенная. */
  disableOption: Option;
  /** aria-label, если нет текстового label */
  ariaLabel?: string;
}

export function RHFToggle<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  label,
  required = false,
  requiredLabel = false,
  optionalLabel = false,
  id,
  description,
  wrapperClassName,
  ariaLabel,
  disabled,
  className,
  variant,
  size,
  enableOption,
  disableOption,
  ...toggleProps
}: RHFToggleProps<TFieldValues>) {
  const ctx = useFormContext<TFieldValues>();
  const effectiveControl = control ?? ctx?.control;
  if (!effectiveControl) {
    throw new Error(
      "[RHFToggle] control is missing (provide prop or wrap with FormProvider)."
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

        // значение из формы (может быть boolean)
        const formValue: boolean = field.value === enableOption.value;

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

            <Toggle
              id={inputId}
              aria-label={label ? undefined : ariaLabel}
              aria-invalid={hasError || undefined}
              aria-errormessage={hasError ? msgId : undefined}
              aria-describedby={!hasError && description ? descId : undefined}
              aria-required={required}
              disabled={disabled}
              pressed={formValue}
              onPressedChange={(pressed) =>
                field.onChange(
                  pressed ? enableOption.value : disableOption.value
                )
              }
              className={cn(
                "w-full min-h-10",
                {
                  // красная обводка/текст при ошибке можно оставить дефолтной shadcn через data-[invalid], но подсветим текст
                  "text-red-500 border-red-300": hasError,
                },
                className
              )}
              variant={variant}
              size={size}
              {...toggleProps}
            >
              {formValue ? enableOption.label : disableOption.label}
            </Toggle>

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
