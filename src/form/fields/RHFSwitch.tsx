/**
 * @file RHFSwitch.tsx
 * @module shared/ui/form/fields
 *
 * @description Switch (тумблер) на базе shadcn/ui + RHF.
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
import { cn } from "@utils/lib";
import { Switch, Label as UiLabel } from "@shadcn";
import { FieldLabel, FieldDescription, FieldError } from "@form/parts";

export interface RHFSwitchProps<
  TFieldValues extends FieldValues = FieldValues
> {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
  label?: React.ReactNode; // Заголовок поля (над свитчем)
  switchLabel?: React.ReactNode; // Подпись справа от свитча
  requiredLabel?: boolean;
  optionalLabel?: boolean;
  id?: string;
  description?: React.ReactNode;
  wrapperClassName?: string;
  className?: string; // класс на ряд со свитчем
  disabled?: boolean;
  ariaLabel?: string;
}

export function RHFSwitch<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  label,
  switchLabel,
  requiredLabel = false,
  optionalLabel = false,
  id,
  description,
  wrapperClassName,
  className,
  disabled,
  ariaLabel,
}: RHFSwitchProps<TFieldValues>) {
  const ctx = useFormContext<TFieldValues>();
  const effectiveControl = control ?? ctx?.control;
  if (!effectiveControl) {
    throw new Error(
      "[RHFSwitch] control is missing (provide prop or wrap with FormProvider)."
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

        const checked = !!field.value;

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

            {/* Обёртка ввода */}
            <div className="relative flex items-center min-h-10">
              <div className={cn("flex items-center gap-2", className)}>
                <Switch
                  id={inputId}
                  checked={checked}
                  onCheckedChange={(v) => field.onChange(v)}
                  disabled={disabled}
                  aria-label={label ? undefined : ariaLabel}
                  aria-invalid={hasError || undefined}
                  aria-errormessage={hasError ? msgId : undefined}
                  aria-describedby={
                    !hasError && description ? descId : undefined
                  }
                />
                {switchLabel ? (
                  <UiLabel
                    htmlFor={inputId}
                    className={cn("font-normal", {
                      "text-red-500": hasError,
                    })}
                  >
                    {switchLabel}
                  </UiLabel>
                ) : null}
              </div>
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
