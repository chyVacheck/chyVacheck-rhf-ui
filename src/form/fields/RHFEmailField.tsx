/**
 * @file RHFEmailField.tsx
 * @module shared/ui/form/fields
 * @description Поле email с иконкой конверта слева, очисткой и ошибками RHF/Zod.
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
import { Mail } from "lucide-react";

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

export interface RHFEmailFieldProps<
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
  /** Что писать в форму при пустом значении */
  emptyAs?: TDeletionValuesKey;
  wrapperClassName?: string;
  ariaLabel?: string;
}

export function RHFEmailField<TFieldValues extends FieldValues = FieldValues>({
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
  autoComplete = "email",
  ...inputProps
}: RHFEmailFieldProps<TFieldValues>) {
  const ctx = useFormContext<TFieldValues>();
  const effectiveControl = control ?? ctx?.control;
  if (!effectiveControl) {
    throw new Error("[RHFEmailField] control is missing");
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
              {/* иконка конверта */}
              <Mail className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id={inputId}
                type="email"
                disabled={disabled}
                autoComplete={autoComplete}
                aria-label={label ? undefined : ariaLabel}
                aria-invalid={hasError || undefined}
                aria-errormessage={hasError ? msgId : undefined}
                aria-describedby={!hasError && description ? descId : undefined}
                className={cn(
                  "min-h-10",
                  "pl-8",
                  {
                    // даём место под кнопку очистки
                    "pr-8": withClearButton,
                    // красная обводка/текст при ошибке можно оставить дефолтной shadcn через data-[invalid], но подсветим текст
                    "text-red-500": hasError,
                  },
                  className
                )}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                {...inputProps}
              />

              {withClearButton && (
                <ClearButton
                  visible={!!field.value && !disabled}
                  onClear={() => {
                    field.onChange(DeletionValuesMap[emptyAs]);
                  }}
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
