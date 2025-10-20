/**
 * @file RHFMultiFileField.tsx
 * @module shared/ui/form/fields
 *
 * @description Поле для загрузки нескольких файлов с поддержкой react-hook-form и shadcn/ui.
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
import { FileText } from "lucide-react";

/**
 * ! my imports
 */
import { cn } from "@utils/lib";
import { Button, ScrollArea } from "@shadcn";
import {
  FieldLabel,
  FieldDescription,
  FieldError,
  ClearButton,
} from "@form/parts";
import { NumberUtils } from "@utils/Number.utils";

type NativeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  | "name"
  | "defaultValue"
  | "value"
  | "onChange"
  | "onBlur"
  | "multiple"
  | "type"
>;

export interface RHFMultiFileFieldProps<
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
  /** Внешний класс обёртки */
  wrapperClassName?: string;
  /** Подсказка для aria-label, если нет явного label */
  ariaLabel?: string;
  /** Разрешить выбор нескольких файлов */
  multiple?: boolean;
  /** Типы файлов для выбора (например, "image/*, .pdf") */
  accept?: string;
  /** Количество файлов, которые будут отображены в скроллере */
  filesCountToShow?: number;
}

function isFileList(value: unknown): value is FileList {
  return (
    value !== null && typeof value === "object" && value instanceof FileList
  );
}

export function RHFMultiFileField<
  TFieldValues extends FieldValues = FieldValues
>({
  name,
  control,
  label,
  requiredLabel = false,
  optionalLabel = false,
  id,
  description,
  wrapperClassName,
  ariaLabel,
  disabled,
  className,
  multiple = false,
  accept,
  placeholder,
  filesCountToShow = 3,
  ...inputProps
}: RHFMultiFileFieldProps<TFieldValues>) {
  const ctx = useFormContext<TFieldValues>();
  const effectiveControl = control ?? ctx?.control;
  if (!effectiveControl) {
    throw new Error(
      "[RHFMultiFileField] control is missing (provide prop or wrap with FormProvider)."
    );
  }

  const inputId = id ?? `field-${name}`;
  const descId = `${inputId}-desc`;
  const msgId = `${inputId}-msg`;
  const maxHeightClass = `max-h-[${filesCountToShow * 36}px]`;

  return (
    <Controller
      control={effectiveControl}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error;
        const errorMessage = fieldState.error?.message as
          | React.ReactNode
          | undefined;

        const files: File[] = [];

        if (Array.isArray(field.value)) {
          // Фильтруем, чтобы убедиться, что все элементы являются объектами File
          files.push(
            ...field.value.filter(
              (item: unknown): item is File => item instanceof File
            )
          );
        } else if (isFileList(field.value)) {
          files.push(
            ...Array.from(field.value).filter(
              (item: unknown): item is File => item instanceof File
            )
          );
        }

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (multiple) {
              // Если multiple, добавляем новые файлы к существующим
              field.onChange([...files, ...newFiles]);
            } else {
              // Если single, заменяем существующие файлы
              field.onChange(newFiles.length > 0 ? [newFiles[0]] : []);
            }
          } else {
            field.onChange([]);
          }
        };

        const handleRemoveFile = (indexToRemove: number) => {
          const updatedFiles = files.filter(
            (_, index) => index !== indexToRemove
          );
          field.onChange(updatedFiles);
        };

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

            <div className="relative flex flex-col gap-2">
              <input
                id={inputId}
                type="file"
                disabled={disabled}
                multiple={multiple}
                accept={accept}
                aria-label={label ? undefined : ariaLabel}
                aria-invalid={hasError || undefined}
                aria-errormessage={hasError ? msgId : undefined}
                aria-describedby={!hasError && description ? descId : undefined}
                className="hidden" // Скрываем нативный инпут
                onChange={handleFileChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                {...inputProps}
              />
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => document.getElementById(inputId)?.click()}
                aria-invalid={hasError || undefined}
                className={cn(
                  "w-full justify-start text-left font-normal min-h-10",
                  {
                    "text-red-500 border-red-300": hasError,
                  },
                  className
                )}
              >
                <span className="text-muted-foreground">
                  {placeholder
                    ? placeholder
                    : multiple
                    ? "Select files"
                    : "Select file"}
                </span>
              </Button>

              {files.length > 0 && (
                <ScrollArea
                  className={cn(
                    "overflow-auto",
                    "flex flex-col gap-2",
                    "rounded-md border",
                    maxHeightClass
                  )}
                >
                  {files.map((file, index) => (
                    <div
                      key={file.name + file.size + index}
                      className={cn(
                        "px-3 py-2",
                        "relative",
                        "flex items-center justify-between text-sm"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" />
                        {file.name} ({NumberUtils.formatBytes(file.size)})
                      </span>
                      {!disabled && (
                        <ClearButton
                          label="Clear file"
                          onClear={() => handleRemoveFile(index)}
                        />
                      )}
                    </div>
                  ))}
                </ScrollArea>
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
