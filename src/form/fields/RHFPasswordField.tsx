/**
 * @file RHFPasswordField.tsx
 * @module shared/ui/form/fields
 *
 * @description Поле ввода пароля для react-hook-form + shadcn/ui.
 * С поддержкой:
 * - показа/скрытия пароля (иконка-глаз)
 * - кнопки очистки
 * - лейбла (required/optional) и описания
 * - отображения ошибок из RHF/Zod
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
import { Eye, EyeOff, LockIcon } from "lucide-react";

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

export interface RHFPasswordFieldProps<
  TFieldValues extends FieldValues = FieldValues
> extends NativeInputProps {
  /** Имя поля (react-hook-form) */
  name: Path<TFieldValues>;
  /** Control из RHF; если не передан — возьмём из FormProvider */
  control?: Control<TFieldValues>;
  /** Лейбл */
  label?: React.ReactNode;
  /** Пометка обязательности (рендерит *) — конфликтует с optional */
  requiredLabel?: boolean;
  /** Пометка необязательности (рендерит (optional)) — конфликтует с requiredLabel */
  optionalLabel?: boolean;
  /** Идентификатор поля */
  id?: string;
  /** Текст-описание под полем */
  description?: React.ReactNode;
  /** Показать кнопку очистки */
  withClearButton?: boolean;
  /** Что писать в форму при пустом значении */
  emptyAs?: TDeletionValuesKey;
  /** Показать кнопку-глаз (показ/скрытие пароля) */
  withToggle?: boolean;
  /** Внешний класс обёртки */
  wrapperClassName?: string;
  /** Если нет label — aria-лейбл */
  ariaLabel?: string;
}

export function RHFPasswordField<
  TFieldValues extends FieldValues = FieldValues
>({
  name,
  control,
  label,
  requiredLabel = false,
  optionalLabel = false,
  id,
  description,
  withClearButton = true,
  emptyAs = "empty-string",
  withToggle = true,
  wrapperClassName,
  ariaLabel,
  disabled,
  className,
  autoComplete = "current-password",
  ...inputProps
}: RHFPasswordFieldProps<TFieldValues>) {
  const ctx = useFormContext<TFieldValues>();
  const effectiveControl = control ?? ctx?.control;
  if (!effectiveControl) {
    throw new Error(
      "[RHFPasswordField] control is missing (provide prop or wrap with FormProvider)."
    );
  }

  const [show, setShow] = React.useState(false);

  const inputId = id ?? `field-${name}`;
  const descId = `${inputId}-desc`;
  const msgId = `${inputId}-msg`;

  const ToggleButton = (
    <button
      type="button"
      aria-label={show ? "Hide password" : "Show password"}
      title={show ? "Hide password" : "Show password"}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // не снимем фокус с инпута
      onClick={() => setShow((s) => !s)}
      className={cn(
        "absolute inset-y-0 my-auto right-2 inline-flex size-6 items-center justify-center rounded-md",
        "border border-transparent hover:border-input",
        "bg-transparent hover:bg-accent",
        "transition-colors",
        "cursor-pointer text-muted-foreground",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {show ? (
        <EyeOff className="size-4" aria-hidden="true" />
      ) : (
        <Eye className="size-4" aria-hidden="true" />
      )}
    </button>
  );

  return (
    <Controller
      control={effectiveControl}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error;
        const errorMessage = fieldState.error?.message as
          | React.ReactNode
          | undefined;

        // Отступ справа под иконки: глаз (+ опционально крестик)
        const needRightSpace = withToggle || withClearButton;

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
              {/* иконка слева */}
              <LockIcon className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id={inputId}
                type={show ? "text" : "password"}
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
                    // даём место под кнопку очистки и глаз
                    "pr-16": needRightSpace,
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

              {withToggle && ToggleButton}

              {withClearButton && (
                <ClearButton
                  className="right-8"
                  visible={!!field.value && !disabled}
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
