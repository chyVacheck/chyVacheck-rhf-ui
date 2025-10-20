/**
 * @file FieldError.tsx
 * @module shared/ui/form/parts
 *
 * @description Маленькое описание ошибки под полем ввода.
 * Показывается, если есть ошибка.
 *
 * @author Dmytro Shakh
 */

/**
 * ! lib imports
 */
import { type ReactNode } from "react";

/**
 * ! my imports
 */
import { cn } from "@utils/lib";

interface FieldErrorProps {
  id?: string;
  /** Дополнительные классы */
  className?: string;
  /** Текст ошибки */
  children?: ReactNode;
}

export function FieldError({ id, className, children }: FieldErrorProps) {
  if (!children) return null;

  return (
    <p
      id={id}
      role="alert"
      className={cn("text-xs text-red-500 mt-1", className)}
    >
      {children}
    </p>
  );
}
