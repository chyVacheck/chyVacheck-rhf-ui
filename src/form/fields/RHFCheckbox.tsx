/**
 * @file RHFCheckbox.tsx
 * @module shared/ui/form/fields
 *
 * @description Checkbox на базе shadcn/ui + RHF.
 * Поддерживает: лейбл (required/optional), описание, ошибки RHF/Zod.
 *
 * @author Dmytro Shakh
 */

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
import { Checkbox, Label as UiLabel } from "@shadcn";
import { FieldLabel, FieldDescription, FieldError } from "./../parts";

export interface RHFCheckboxProps<
  TFieldValues extends FieldValues = FieldValues
> {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
  label?: React.ReactNode; // Заголовок поля (над чекбоксом)
  checkboxLabel?: React.ReactNode; // Подпись справа от самого чекбокса
  required?: boolean;
  requiredLabel?: boolean;
  optionalLabel?: boolean;
  id?: string;
  description?: React.ReactNode;
  wrapperClassName?: string;
  className?: string; // класс на контейнер чекбокса (ряд)
  disabled?: boolean;
  ariaLabel?: string;
}

export function RHFCheckbox<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  label,
  checkboxLabel,
  required = false,
  requiredLabel = false,
  optionalLabel = false,
  id,
  description,
  wrapperClassName,
  className,
  disabled,
  ariaLabel,
}: RHFCheckboxProps<TFieldValues>) {
  const ctx = useFormContext<TFieldValues>();
  const effectiveControl = control ?? ctx?.control;
  if (!effectiveControl) {
    throw new Error(
      "[RHFCheckbox] control is missing (provide prop or wrap with FormProvider)."
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
            <div className="relative">
              <div className={cn("flex items-center gap-2", className)}>
                <Checkbox
                  id={inputId}
                  checked={checked}
                  required={required}
                  onCheckedChange={(v) => field.onChange(Boolean(v))}
                  disabled={disabled}
                  aria-label={label ? undefined : ariaLabel}
                  aria-invalid={hasError || undefined}
                  aria-errormessage={hasError ? msgId : undefined}
                  aria-describedby={
                    !hasError && description ? descId : undefined
                  }
                />
                {checkboxLabel ? (
                  <UiLabel
                    htmlFor={inputId}
                    className={cn({
                      "text-red-500": hasError,
                    })}
                  >
                    {checkboxLabel}
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
