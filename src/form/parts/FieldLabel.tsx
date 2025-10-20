/**
 * @file FieldLabel.tsx
 * @module shared/ui/form/parts
 *
 * @description Обёртка над shadcn/ui Label с поддержкой:
 * - обязательности (звёздочка *)
 * - состояния ошибки (красный цвет)
 * - кастомных классов
 *
 * @author Dmytro Shakh
 */

/**
 * ! lib imports
 */
import { forwardRef, useMemo } from "react";

/**
 * ! my imports
 */
import { cn } from "@utils/lib";
import { Label as UiLabel } from "@shadcn";

interface FieldLabelProps
  extends React.ComponentPropsWithoutRef<typeof UiLabel> {
  /** Поле обязательно — отобразить звёздочку */
  required?: boolean;
  /** Поле необязательно — отобразить пометку (optional) */
  optional?: boolean;
  /** Есть ли ошибка (окрашивает лейбл и звёздочку) */
  error?: boolean;
  /** Скрыть звёздочку, даже если required=true (на случай спец-кейсов) */
  hideAsterisk?: boolean;
}

export const FieldLabel = forwardRef<HTMLLabelElement, FieldLabelProps>(
  function FieldLabel(
    {
      required = false,
      optional = false,
      error = false,
      hideAsterisk = false,
      className,
      children,
      ...rest
    },
    ref
  ) {
    // Жёсткая проверка конфликтующих пропсов
    if (required && optional) {
      throw new Error(
        '[FieldLabel] Can not use props "required" and "optional" in one time.'
      );
    }

    // Что именно отображать справа от лейбла
    const rightBadge = useMemo(() => {
      // показ "*"
      if (required && !hideAsterisk) {
        return (
          <span aria-hidden="true" className={cn("font-medium text-red-500")}>
            *
          </span>
        );
      }

      // показ "(optional)"
      if (optional) {
        return (
          <span
            className={cn("text-xs", "text-muted-foreground", {
              "text-red-500": error,
            })}
          >
            (optional)
          </span>
        );
      }

      return null;
    }, [required, optional, hideAsterisk, error]);

    return (
      <UiLabel
        ref={ref}
        {...rest}
        aria-invalid={error || undefined}
        className={cn(
          "text-foreground font-normal",
          {
            "text-red-500": error,
          },
          "inline-flex items-center gap-0.5 ",
          className
        )}
      >
        {children}
        {rightBadge}
      </UiLabel>
    );
  }
);
