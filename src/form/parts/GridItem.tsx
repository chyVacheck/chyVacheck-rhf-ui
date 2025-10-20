/**
 * @file GridItem.tsx
 * @module shared/ui/form/parts
 *
 * @description Универсальный элемент сетки (день/месяц/год/час/минута)
 * для пикеров даты/времени. Рендерится как <li>, поддерживает
 * активное/неактивное состояние, disabled/empty и a11y-атрибуты.
 *
 * @author Dmytro Shakh
 */

/**
 * ! lib imports
 */
import { forwardRef, type AriaRole, type ReactNode } from "react";

/**
 * ! my imports
 */
import { cn } from "@utils/lib";

export type GridItemProps = {
  /** Отображаемое значение */
  value: ReactNode;
  /** Активен (подсвечен) */
  isActive?: boolean;
  /** Пустая ячейка (заглушка) */
  isEmpty?: boolean;
  /** Недоступна для выбора */
  isDisabled?: boolean;
  /** Выбрано но не сохранено */
  isDraft?: boolean;
  /** Клик по доступному элементу */
  onClick?: () => void;

  /** Доп. классы */
  className?: string;
  /** Размер ячейки (минимальные габариты) */
  size?: "sm" | "md";
  /** Роль списка, если нужен явный grid/listbox */
  role?: AriaRole;
  /** Управляемый tabIndex для а11y-навигации */
  tabIndex?: number;
};

export const GridItem = forwardRef<HTMLLIElement, GridItemProps>(
  (
    {
      value,
      isActive = false,
      isEmpty = false,
      isDisabled = false,
      isDraft = false,
      onClick,
      className,
      size = "md",
      role,
      tabIndex,
    },
    ref
  ) => {
    const clickable = !isEmpty && !isDisabled && !!onClick;

    return (
      <li
        ref={ref}
        role={role}
        aria-selected={isActive || undefined}
        aria-disabled={isDisabled || undefined}
        tabIndex={typeof tabIndex === "number" ? tabIndex : clickable ? 0 : -1}
        onClick={clickable ? onClick : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        className={cn(
          "select-none rounded-md text-sm flex items-center justify-center focus:outline-none",
          // размеры
          size === "md" ? "min-h-8 min-w-9" : "min-h-7 min-w-8",
          {
            "bg-blue-500 text-white": !isEmpty && isActive,
            "cursor-not-allowed opacity-50 text-muted-foreground": isDisabled,
            "cursor-pointer hover:text-blue-700 hover:bg-blue-100 hover:ring-1 hover:ring-blue-300":
              !isEmpty && !isActive && !isDisabled,
            "text-blue-700 bg-blue-100 ring-1 ring-blue-300":
              !isActive && isDraft,
          },
          className
        )}
      >
        {value}
      </li>
    );
  }
);

GridItem.displayName = "GridItem";
