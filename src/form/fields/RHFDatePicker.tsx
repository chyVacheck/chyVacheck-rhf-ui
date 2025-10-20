/**
 * @file RHFDatePicker.tsx
 * @module shared/ui/form/fields
 *
 * @description Выбор даты (без времени) + быстрый выбор Месяц/Год.
 * - RHF + shadcn/ui (Popover, Calendar, ScrollArea, Button)
 * - Хранение: 'YYYY-MM-DD' (по умолчанию) или Date (опционально)
 * - По клику на заголовок (кнопку) переключаем вид:
 *   дни <-> две колонки (месяцы | годы) со скроллом
 *
 * @author Dmytro Shakh
 */

/**
 * @file RHFDatePicker.tsx
 * @module components/form/fields
 *
 * @description Выбор даты (без времени).
 * - RHF + shadcn/ui (Popover, ScrollArea, Button)
 * - Хранение: ISO-строка (UTC) или Date — через valueAs
 * - Переключение вида: дни <-> (месяцы | годы)
 *
 * @author Dmytro Shakh
 */

"use client";

/**
 * ! my imports
 */
import { useEffect, useMemo, useState } from "react";
import {
  useFormContext,
  useController,
  type Path,
  type FieldValues,
  type Control,
  type FieldPath,
} from "react-hook-form";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * ! my imports
 */
import { cn } from "@utils/lib";
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  ScrollArea,
} from "@shadcn";
import {
  FieldLabel,
  FieldDescription,
  ClearButton,
  GridItem,
  FieldError,
} from "@form/parts";
import { DateUtils, type DateRange } from "@utils/Date.utils";
import { NumberUtils } from "@utils/Number.utils";
import { type TDeletionValuesKey } from "@ui-types/DeletionValues";
import { DeletionValuesMap } from "@utils/constants";

const formatDisplay = (d: Date, locale = "en-EN") =>
  new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);

const parseToDate = (v: unknown): Date | null => {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "string") {
    const x = new Date(v);
    return isNaN(x.getTime()) ? null : x;
  }
  return null;
};

// Понедельник-первый: 1..7 (JS Sunday=0) -> смещение
const weekdayIndexMonFirst = (jsDay: number) => (jsDay === 0 ? 6 : jsDay - 1);

const buildDaysGrid = (base: Date): (number | null)[] => {
  const first = DateUtils.startOfMonth(base);
  const daysInMonth = DateUtils.endOfMonth(base).getDate();
  const startOffset = weekdayIndexMonFirst(first.getDay());

  const out: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) out.push(null);
  for (let d = 1; d <= daysInMonth; d++) out.push(d);
  while (out.length % 7 !== 0) out.push(null);
  return out;
};

const weekdaysShortMonFirst = (locale = "en-EN"): string[] => {
  const monday = new Date(2024, 0, 1); // понедельник
  return NumberUtils.range(7).map((i: number) =>
    new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
      new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    )
  );
};

/* ==============================
   ПРОПСЫ
   ============================== */
type ValueAs = "iso" | "date";
type ViewMode = "date" | "month-year";

export type RHFDatePickerProps<TFieldValues extends FieldValues = FieldValues> =
  {
    name: FieldPath<TFieldValues>;
    control?: Control<TFieldValues>;

    label?: React.ReactNode;
    description?: React.ReactNode;
    placeholder?: string;
    wrapperClassName?: string;
    className?: string;
    disabled?: boolean;
    requiredLabel?: boolean;
    optionalLabel?: boolean;
    id?: string;
    withLeftIcon?: boolean;
    /** Показать кнопку очистки внутри инпута */
    withClearButton?: boolean;
    /** Что писать в форму при пустом значении */
    emptyAs?: TDeletionValuesKey;
    displayLocale?: string;

    minDate?: Date;
    maxDate?: Date;
    disabledDates?: (d: Date) => boolean;

    valueAs?: ValueAs;
  };

/* ==============================
   КОМПОНЕНТ
   ============================== */
export function RHFDatePicker<TFieldValues extends FieldValues>({
  name,
  control: controlProp,
  label,
  description,
  placeholder = "Choose date",
  wrapperClassName,
  className,
  disabled,
  requiredLabel,
  optionalLabel,
  id,
  withLeftIcon = true,
  withClearButton = true,
  emptyAs = "empty-string",
  displayLocale = "en-EN",

  minDate,
  maxDate,
  disabledDates,

  valueAs = "date",
}: RHFDatePickerProps<TFieldValues>) {
  const ctx = useFormContext<TFieldValues>();
  const control = controlProp ?? ctx?.control;
  if (!control)
    throw new Error(
      "[RHFDatePicker] control is missing (provide prop or wrap with FormProvider)."
    );

  const { field, fieldState } = useController<
    TFieldValues,
    FieldPath<TFieldValues>
  >({ name, control });
  const hasZodError = !!fieldState.error;
  const zodErrorMsg = fieldState.error?.message as React.ReactNode | undefined;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("date");
  const [displayDate, setDisplayDate] = useState<Date>(() => new Date());

  const selected: Date | null = useMemo(
    () => parseToDate(field.value),
    [field.value]
  );

  const rangeObj = useMemo<DateRange>(
    () => ({ min: minDate, max: maxDate }),
    [minDate, maxDate]
  );

  useEffect(() => {
    if (!open) return;
    // если selected есть — привязываемся к нему;
    // иначе, если min задан — стартуем с него; иначе max; иначе сегодня
    const base = selected ?? minDate ?? maxDate ?? new Date();
    setDisplayDate(DateUtils.startOfMonth(base));
  }, [open, selected, minDate, maxDate]);

  const formatted = selected ? formatDisplay(selected, displayLocale) : "";

  /* Навигация по месяцам */
  const canNavigatePrev = useMemo(() => {
    if (!minDate) return true;
    const prevLast = DateUtils.endOfMonth(DateUtils.addMonths(displayDate, -1));
    return prevLast >= DateUtils.stripTime(minDate);
  }, [displayDate, minDate]);

  const canNavigateNext = useMemo(() => {
    if (!maxDate) return true;
    const nextFirst = DateUtils.startOfMonth(
      DateUtils.addMonths(displayDate, 1)
    );
    return nextFirst <= DateUtils.stripTime(maxDate);
  }, [displayDate, maxDate]);

  const toggleView = () =>
    setView((v) => (v === "date" ? "month-year" : "date"));

  /* Коммит значения в форму */
  const commit = (d: Date | undefined) => {
    if (d == undefined) {
      field.onChange(DeletionValuesMap[emptyAs]);
      return;
    }
    // безопасность: не даём записать вне диапазона
    if (!DateUtils.isDateInRange(d, rangeObj, true)) return;

    const onlyDate = DateUtils.stripTime(d);
    if (valueAs === "iso") field.onChange(onlyDate.toISOString());
    else field.onChange(onlyDate);
  };

  const handleDateSelect = (dayNum: number) => {
    const next = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth(),
      dayNum
    );
    commit(next);
  };

  const handleMonthChange = (m0: number) => {
    const next = new Date(displayDate.getFullYear(), m0, 1);
    setDisplayDate(DateUtils.startOfMonth(next));
    setView("date");
  };

  const handleYearChange = (year: number) => {
    const next = new Date(year, displayDate.getMonth(), 1);
    setDisplayDate(DateUtils.startOfMonth(next));
  };

  const navigateMonth = (dir: number) =>
    setDisplayDate((d) => DateUtils.addMonths(d, dir));

  const localError =
    selected &&
    ((minDate && selected < minDate) || (maxDate && selected > maxDate))
      ? "Date are not in range."
      : undefined;
  const hasError = !!(hasZodError || localError);
  const errorMessage = (hasZodError ? zodErrorMsg : localError) ?? undefined;

  const idSafe = id ?? String(name);
  const weekdays = useMemo(
    () => weekdaysShortMonFirst(displayLocale),
    [displayLocale]
  );

  const daysGrid = useMemo(() => buildDaysGrid(displayDate), [displayDate]);

  const yearRange = useMemo(() => DateUtils.getYearRange(rangeObj), [rangeObj]);

  const clear = () => commit(undefined);

  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label ? (
        <FieldLabel
          htmlFor={idSafe}
          required={requiredLabel}
          optional={optionalLabel}
          error={hasError}
        >
          {label}
        </FieldLabel>
      ) : null}

      <div className="relative min-h-10">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              id={idSafe}
              variant="outline"
              disabled={disabled}
              aria-invalid={hasError || undefined}
              className={cn(
                "w-full justify-start text-left font-normal min-h-10",
                {
                  "pl-8": withLeftIcon,
                  "text-red-500 border-red-300": hasError,
                },
                className
              )}
            >
              {withLeftIcon && (
                <CalendarIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              )}
              {formatted ? (
                formatted
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="center"
            side="bottom"
            className="py-2 px-3 w-80"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => navigateMonth(-1)}
                  disabled={!canNavigatePrev || view !== "date"}
                  className={cn(view !== "date" && "invisible")}
                >
                  <ChevronLeft className="size-4" />
                </Button>

                <button
                  type="button"
                  onClick={toggleView}
                  className="cursor-pointer rounded-full px-2 py-1 bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
                >
                  {new Intl.DateTimeFormat(displayLocale, {
                    month: "short",
                    year: "numeric",
                  }).format(displayDate)}
                </button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => navigateMonth(1)}
                  disabled={!canNavigateNext || view !== "date"}
                  className={cn(view !== "date" && "invisible")}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>

              {view === "date" ? (
                <div className="flex flex-col gap-2">
                  <ul className="grid grid-cols-7 gap-1">
                    {weekdays.map((w, i) => (
                      <li
                        key={`${w}-${i}`}
                        className="text-center text-xs font-medium text-muted-foreground select-none"
                      >
                        {w}
                      </li>
                    ))}
                  </ul>
                  <ul className="grid grid-cols-7 gap-1">
                    {daysGrid.map((d, idx) => {
                      const isEmpty = d == null;
                      const dayDate = !isEmpty
                        ? new Date(
                            displayDate.getFullYear(),
                            displayDate.getMonth(),
                            d as number
                          )
                        : null;
                      const isDisabled =
                        isEmpty ||
                        (dayDate &&
                          DateUtils.isDayDisabled(
                            dayDate,
                            rangeObj,
                            disabledDates
                          ));

                      const isActive =
                        !!selected &&
                        selected.getFullYear() === displayDate.getFullYear() &&
                        selected.getMonth() === displayDate.getMonth() &&
                        selected.getDate() === (d as number);

                      return (
                        <GridItem
                          key={idx}
                          value={isEmpty ? " " : String(d)}
                          isActive={!!isActive}
                          isDisabled={!!isDisabled}
                          isEmpty={isEmpty}
                          onClick={() =>
                            !isEmpty &&
                            !isDisabled &&
                            handleDateSelect(d as number)
                          }
                        />
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className="flex gap-2">
                  <ScrollArea className="h-52 w-full">
                    <ul className="flex flex-col gap-1 p-1">
                      {NumberUtils.range(12)
                        .filter((m0: number) =>
                          DateUtils.isMonthInRange(
                            displayDate.getFullYear(),
                            m0,
                            rangeObj
                          )
                        )
                        .map((m0: number) => {
                          const disabledMonth = !DateUtils.isMonthInRange(
                            displayDate.getFullYear(),
                            m0,
                            rangeObj
                          );

                          const isActive =
                            !!selected &&
                            selected.getFullYear() ===
                              displayDate.getFullYear() && // чтобы не подсвечивался «тот же месяц» в другом году
                            selected.getMonth() === m0;

                          return (
                            <GridItem
                              key={m0}
                              value={DateUtils.getMonthShort(m0, displayLocale)}
                              isActive={isActive}
                              isDisabled={disabledMonth}
                              onClick={() => handleMonthChange(m0)}
                            />
                          );
                        })}
                    </ul>
                  </ScrollArea>

                  <ScrollArea className="h-52 w-full">
                    <ul className="flex flex-col gap-1 p-1">
                      {NumberUtils.range(yearRange.end - yearRange.start + 1)
                        .map((i: number) => yearRange.start + i)
                        .filter((y: number) =>
                          DateUtils.isYearInRange(y, rangeObj)
                        )
                        .map((y: number) => {
                          const disabledYear = !DateUtils.isYearInRange(
                            y,
                            rangeObj
                          );
                          const isActive =
                            !!selected && selected.getFullYear() === y;

                          return (
                            <GridItem
                              key={y}
                              value={String(y)}
                              isActive={isActive}
                              isDisabled={disabledYear}
                              onClick={() => handleYearChange(y)}
                            />
                          );
                        })}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {withClearButton && formatted && !disabled && (
          <ClearButton visible onClear={clear} />
        )}
      </div>

      <FieldDescription id={`${idSafe}-desc`} error={hasError}>
        {description}
      </FieldDescription>

      <FieldError id={`${idSafe}-msg`}>{errorMessage}</FieldError>
    </div>
  );
}
