/**
 * @file Form.tsx
 * @module shared/ui/form
 *
 * @description Базовый каркас формы:
 * - Инициализация react-hook-form
 * - Поддержка валидации через Zod (zodResolver)
 * - FormProvider для дочерних RHF-компонентов
 * - Верхний баннер serverError (опционально)
 * - Глобальный disabled через <fieldset>
 *
 * @author Dmytro Shakh
 */

/**
 * ! lib imports
 */
import * as React from "react";
import {
  FormProvider,
  type FieldValues,
  type SubmitErrorHandler,
  type UseFormReturn,
} from "react-hook-form";

/**
 * ! my imports
 */
import { cn } from "@utils/lib";

export interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  form: UseFormReturn<TFieldValues>;

  /** Сабмит хендлер. Возвращаемый промис можно не await-ить: RHF сам справится */
  onSubmit: (
    values: TFieldValues,
    methods: UseFormReturn<TFieldValues>
  ) => void | Promise<void>;

  /** Хендлер ошибок сабмита (необязательно) */
  onError?: SubmitErrorHandler<TFieldValues>;

  /** Дочерние элементы — ваши RHF* поля и т.п. */
  children: React.ReactNode;

  /** HTML-атрибуты формы/обёртки */
  id?: string;

  className?: string;

  /** Отключить нативную валидацию браузера (по умолчанию выключаем) */
  noValidate?: boolean;

  /** Коллбек после инициализации формы — если нужно забрать methods снаружи */
  onInit?: (methods: UseFormReturn<TFieldValues>) => void;
}

export function Form<TFieldValues extends FieldValues = FieldValues>({
  form: formProp,
  onSubmit,
  onError,
  children,
  id,
  className,
  noValidate = true,
  onInit,
}: FormProps<TFieldValues>) {
  // если form передали — берём его; иначе создаём локально
  const methods: UseFormReturn<TFieldValues> = formProp;

  React.useEffect(() => {
    onInit?.(methods);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> =
    methods.handleSubmit((values) => onSubmit(values, methods), onError);

  return (
    <FormProvider {...methods}>
      <form
        id={id}
        onSubmit={handleSubmit}
        noValidate={noValidate}
        className={cn("min-w-0 w-full", className)}
      >
        {children}
      </form>
    </FormProvider>
  );
}
