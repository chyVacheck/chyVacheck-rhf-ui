/**
 * @file ClearButton.tsx
 * @module shared/ui/form/parts
 *
 * @description Кнопка очистки поля (крестик) для размещения внутри инпута справа.
 * Требует, чтобы контейнер был `relative`, а инпут имел правый padding (например, pr-8).
 *
 * @author Dmytro Shakh
 */

/**
 * ! lib imports
 */
import { XIcon } from "lucide-react";

/**
 * ! my imports
 */
import { cn } from "@utils/lib";

interface ClearButtonProps {
  /** Показать/скрыть кнопку */
  visible?: boolean;
  /** Коллбек очистки значения */
  onClear: () => void;
  /** Отключить кнопку */
  disabled?: boolean;
  /** aria-label и title кнопки */
  label?: string;

  className?: string;
}

export function ClearButton({
  visible = true,
  onClear,
  disabled = false,
  label = "Clear",
  className,
}: ClearButtonProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(e) => {
        // не снимаем фокус с инпута при клике
        e.preventDefault();
      }}
      onClick={() => {
        if (!disabled) onClear();
      }}
      className={cn(
        "absolute inset-y-0 my-auto right-2 inline-flex size-6 items-center justify-center rounded-md",
        "border border-transparent hover:border-input",
        "bg-transparent hover:bg-accent",
        "transition-colors",
        "cursor-pointer text-muted-foreground",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <XIcon className="size-4" aria-hidden="true" />
    </button>
  );
}
