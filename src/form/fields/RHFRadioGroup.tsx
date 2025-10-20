/**
 * @file RHFRadioGroup.tsx
 * @module shared/ui/form/fields
 *
 * @description RadioGroup на базе shadcn/ui + RHF.
 * Поддержка: лейбл (required/optional), описание, ошибки RHF/Zod.
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
import { RadioGroup, RadioGroupItem, Label as UiLabel } from "@shadcn";
import { cn } from "@utils/lib";
import { FieldLabel, FieldDescription, FieldError } from "@form/parts";

export type RadioOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  description?: React.ReactNode;
};

export interface RHFRadioGroupProps<
  TFieldValues extends FieldValues = FieldValues
> {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
  label?: React.ReactNode;
  required?: boolean;
  requiredLabel?: boolean;
  optionalLabel?: boolean;
  id?: string; // Базовый id; на элементы добавим суффиксы
  description?: React.ReactNode;
  options: RadioOption[];
  wrapperClassName?: string;
  className?: string; // класс на сам RadioGroup
  disabled?: boolean;
  ariaLabel?: string;
  /** Раскладка: 'row' | 'col' */
  direction?: "row" | "col";
}

export function RHFRadioGroup<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  label,
  required = false,
  requiredLabel = false,
  optionalLabel = false,
  id,
  description,
  options,
  wrapperClassName,
  className,
  disabled,
  ariaLabel,
  direction = "col",
}: RHFRadioGroupProps<TFieldValues>) {
  const ctx = useFormContext<TFieldValues>();
  const effectiveControl = control ?? ctx?.control;
  if (!effectiveControl) {
    throw new Error(
      "[RHFRadioGroup] control is missing (provide prop or wrap with FormProvider)."
    );
  }

  const baseId = id ?? `field-${name}`;
  const descId = `${baseId}-desc`;
  const msgId = `${baseId}-msg`;

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
            {label ? (
              <FieldLabel
                htmlFor={baseId}
                required={requiredLabel}
                optional={optionalLabel}
                error={hasError}
              >
                {label}
              </FieldLabel>
            ) : null}

            {/* Обёртка ввода */}
            <div className="relative min-h-10">
              <RadioGroup
                required={required}
                id={baseId}
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v)}
                disabled={disabled}
                aria-label={label ? undefined : ariaLabel}
                aria-invalid={hasError || undefined}
                aria-errormessage={hasError ? msgId : undefined}
                aria-describedby={!hasError && description ? descId : undefined}
                className={cn(
                  direction === "row"
                    ? "flex flex-row flex-wrap gap-4"
                    : "flex flex-col gap-2",
                  className
                )}
              >
                {options.map((opt, idx) => {
                  const itemId = `${baseId}-${idx}`;
                  return (
                    <div key={itemId} className="flex items-start gap-2">
                      <RadioGroupItem
                        id={itemId}
                        value={opt.value}
                        disabled={disabled || opt.disabled}
                      />
                      <div className="grid">
                        <UiLabel
                          htmlFor={itemId}
                          className={cn({
                            "text-red-500": hasError,
                            "cursor-pointer": !(disabled || opt.disabled),
                            "cursor-not-allowed": disabled || opt.disabled,
                          })}
                        >
                          {opt.label}
                        </UiLabel>
                        {opt.description ? (
                          <span className="text-xs text-muted-foreground">
                            {opt.description}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
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
