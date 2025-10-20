/**
 * @file FieldDescription.tsx
 * @module shared/ui/form/parts
 *
 * @description Маленькое описание под полем ввода.
 * Скрывается, если есть ошибка (error=true), чтобы не конфликтовать с FormMessage.
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

interface FieldDescriptionProps {
  /** Текст описания */
  children?: ReactNode;
  /** Скрыть описание при ошибке */
  error?: boolean;
  /** Для aria-describedby связи с input */
  id?: string;
  className?: string;
}

export function FieldDescription({
  children,
  error = false,
  id,
  className,
}: FieldDescriptionProps) {
  if (error || !children) return null;

  return (
    <p id={id} className={cn("text-xs text-muted-foreground mt-1", className)}>
      {children}
    </p>
  );
}
