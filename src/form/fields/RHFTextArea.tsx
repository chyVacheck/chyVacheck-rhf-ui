/**
 * @file RHFTextArea.tsx
 * @module shared/ui/form/fields
 *
 * @description Textarea для react-hook-form + shadcn/ui.
 * Поддержка: лейбл (required/optional), описание, ошибки RHF/Zod,
 * кнопка очистки, опциональный автогроу без зависимостей, счётчик символов.
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
import { Textarea } from "@shadcn";
import {
  FieldLabel,
  FieldDescription,
  ClearButton,
  FieldError,
} from "@form/parts";
import { DeletionValuesMap } from "@utils/constants";
import { type TDeletionValuesKey } from "@ui-types/DeletionValues";

type NativeTextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "name" | "defaultValue" | "value" | "onChange" | "onBlur" | "size"
>;

export interface RHFTextAreaProps<
  TFieldValues extends FieldValues = FieldValues
> extends NativeTextareaProps {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
  label?: React.ReactNode;
  requiredLabel?: boolean;
  optionalLabel?: boolean;
  id?: string;
  description?: React.ReactNode;
  withClearButton?: boolean;
  withCounter?: boolean;
  /** Что писать в форму при пустом значении */
  emptyAs?: TDeletionValuesKey;
  wrapperClassName?: string;
  ariaLabel?: string;

  /** Автоматически подгонять высоту под контент (без зависимостей) */
  autoGrow?: boolean;
  /** Показывать счётчик символов (использует maxLength, если задан) */
  showCharCounter?: boolean;
}

export function RHFTextArea<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  label,
  requiredLabel = false,
  optionalLabel = false,
  id,
  description,
  withClearButton = true,
  withCounter = false,
  emptyAs = "undefined",
  wrapperClassName,
  ariaLabel,
  disabled,
  className,
  rows = 4,
  autoGrow = false,
  showCharCounter = false,
  maxLength,
  ...inputProps
}: RHFTextAreaProps<TFieldValues>) {
  const ctx = useFormContext<TFieldValues>();
  const effectiveControl = control ?? ctx?.control;
  if (!effectiveControl) {
    throw new Error(
      "[RHFTextArea] control is missing (provide prop or wrap with FormProvider)."
    );
  }

  const inputId = id ?? `field-${name}`;
  const descId = `${inputId}-desc`;
  const msgId = `${inputId}-msg`;

  const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const resizeToFit = React.useCallback(() => {
    if (!autoGrow || !textAreaRef.current) return;
    const el = textAreaRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [autoGrow]);

  React.useEffect(() => {
    // первичный автогроу (на случай дефолтных значений)
    resizeToFit();
  }, [resizeToFit]);

  return (
    <Controller
      control={effectiveControl}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error;
        const errorMessage = fieldState.error?.message as
          | React.ReactNode
          | undefined;

        const value: string = field.value ?? "";
        const currentLength = value.length;
        const counterText =
          typeof maxLength === "number"
            ? `${currentLength}/${maxLength}`
            : `${currentLength}`;

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

            <div className="relative">
              <Textarea
                id={inputId}
                ref={(el) => {
                  textAreaRef.current = el;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (field as any).ref(el);
                }}
                disabled={disabled}
                rows={rows}
                maxLength={maxLength}
                aria-label={label ? undefined : ariaLabel}
                aria-invalid={hasError || undefined}
                aria-errormessage={hasError ? msgId : undefined}
                aria-describedby={!hasError && description ? descId : undefined}
                className={cn(
                  {
                    // место под кнопку очистки и счётчик в углу
                    "pr-10": withClearButton,
                    "pb-6": showCharCounter,
                    // красная обводка/текст при ошибке можно оставить дефолтной shadcn через data-[invalid], но подсветим текст
                    "text-red-500": hasError,
                  },
                  className
                )}
                value={value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  if (autoGrow) resizeToFit();
                }}
                onBlur={() => {
                  field.onBlur();
                  if (autoGrow) resizeToFit();
                }}
                {...inputProps}
              />

              {/* Кнопка очистки (в правом верхнем углу) */}
              {withClearButton && (
                <ClearButton
                  className="right-2 top-2 my-0"
                  visible={value !== "" && !disabled}
                  onClear={() => {
                    field.onChange(DeletionValuesMap[emptyAs]);
                    if (autoGrow) resizeToFit();
                  }}
                />
              )}

              {/* Счётчик символов (в правом нижнем углу) */}
              {showCharCounter && (
                <span className="pointer-events-none absolute bottom-1 right-2 select-none text-[10px] text-muted-foreground">
                  {counterText}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <FieldDescription id={descId} error={hasError}>
                {description}
              </FieldDescription>
              {withCounter && (
                <span className="text-xs text-muted-foreground mt-1 ml-auto">
                  {field.value ? field.value.length : 0} / {maxLength}
                </span>
              )}
            </div>

            <FieldError id={msgId}>{errorMessage}</FieldError>
          </div>
        );
      }}
    />
  );
}
