/**
 * @file RHFDateTimePicker.tsx
 * @module shared/ui/form/fields
 *
 * @description Дата + время без внешних дат-библиотек.
 * - RHF + shadcn/ui (Popover, ScrollArea, Button)
 * - Хранение: ISO-строка (UTC) или Date (локально) — через valueAs
 * - Переключение вида: дни <-> (месяцы | годы)
 * - Шаг минут: minuteStep
 * - Ограничения minDate/maxDate + кастомный disabledDates
 *
 * @author Dmytro Shakh
 */

"use client";

/**
 * ! my imports
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  useFormContext,
  useController,
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

/**
 * ? === === === === === === === === ===
 * ? ВСПОМОГАТЕЛЬНЫЕ УТИЛИТЫ (без либ)
 * ? === === === === === === === === ===
 */

type ValueAs = "iso" | "date";
type ViewMode = "date" | "month-year";

const formatDisplay = (d: Date, locale = "en-EN") => {
  const datePart = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
  const timePart = `${NumberUtils.pad2(d.getHours())}:${NumberUtils.pad2(
    d.getMinutes()
  )}`;
  return `${datePart} / ${timePart}`;
};

// Парс строки любой (ISO / yyyy-mm-dd / и т.п.) в Date (если валидна)
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

// Сетка дней (понедельник — первый). Возвращает массив длиной кратной 7 с числами или null (пустые ячейки)
const buildDaysGrid = (base: Date): (number | null)[] => {
  const first = DateUtils.startOfMonth(base);
  const daysInMonth = DateUtils.endOfMonth(base).getDate();
  const startOffset = weekdayIndexMonFirst(first.getDay()); // сколько пустых до 1-го числа

  const out: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) out.push(null);
  for (let d = 1; d <= daysInMonth; d++) out.push(d);
  // добьём до кратности 7
  while (out.length % 7 !== 0) out.push(null);
  return out;
};

// Локализация коротких названий дней (Пн..Вс)
const weekdaysShortMonFirst = (locale = "en-EN") => {
  const monday = new Date(2024, 0, 1); // 1 янв 2024 — понедельник
  return NumberUtils.range(7).map((i) =>
    new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
      new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    )
  );
};

export type RHFDateTimePickerProps<TFieldValues extends FieldValues> = {
  name: FieldPath<TFieldValues>;
  control?: Control<TFieldValues>;

  /* UI */
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
  withClearButton?: boolean;
  displayLocale?: string;

  /* Ограничения */
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: (d: Date) => boolean;

  /* Поведение */
  minuteStep?: number; // шаг минут
  valueAs?: ValueAs; // как хранить в форме
  requireTime?: boolean; // требовать выбор времени
};

export function RHFDateTimePicker<TFieldValues extends FieldValues>({
  name,
  control: controlProp,
  label,
  description,
  placeholder = "Choose date and time",
  wrapperClassName,
  className,
  disabled,
  requiredLabel = false,
  optionalLabel = false,
  id,
  withLeftIcon = true,
  withClearButton = true,
  displayLocale = "en-EN",

  minDate,
  maxDate,
  disabledDates,

  minuteStep = 5,
  valueAs = "date",
  requireTime = true,
}: RHFDateTimePickerProps<TFieldValues>) {
  /* RHF */
  const ctx = useFormContext<TFieldValues>();
  const control = controlProp ?? ctx?.control;
  if (!control)
    throw new Error(
      "[RHFDateTimePicker] control is missing (provide prop or wrap with FormProvider)."
    );

  const { field, fieldState } = useController<
    TFieldValues,
    FieldPath<TFieldValues>
  >({ name, control });
  const hasZodError = !!fieldState.error;
  const zodErrorMsg = fieldState.error?.message as React.ReactNode | undefined;

  /* Внутренние состояния */
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("date");
  const [displayDate, setDisplayDate] = useState<Date>(() => new Date());
  const [draft, setDraft] = useState<Date>(() => new Date());
  const [picked, setPicked] = useState<{ date: boolean; time: boolean }>({
    date: false,
    time: false,
  });

  // Выбранное из формы -> Date
  const selected: Date | null = useMemo(
    () => parseToDate(field.value),
    [field.value]
  );

  const rangeObj = useMemo<DateRange>(
    () => ({ min: minDate, max: maxDate }),
    [minDate, maxDate]
  );

  // При открытии — синхронизируем состояния с выбранным / minDate / now
  useEffect(() => {
    if (!open) return;
    const base =
      selected ??
      (minDate
        ? new Date(Math.max(Date.now(), minDate.getTime()))
        : new Date());
    const normalized = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      base.getHours(),
      Math.floor(base.getMinutes() / minuteStep) * minuteStep
    );
    setDisplayDate(DateUtils.startOfMonth(base));
    setDraft(normalized);
    const has = !!selected;
    setPicked({ date: has, time: has });
    setHourTouched(has);
    setMinuteTouched(has);
  }, [open, selected, minDate, minuteStep]);

  // Формат отображения значения в триггере
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

  const [hourTouched, setHourTouched] = useState(false);
  const [minuteTouched, setMinuteTouched] = useState(false);

  const toggleView = () =>
    setView((v) => (v === "date" ? "month-year" : "date"));

  /* Коммит значения в форму */
  const commit = (d: Date | undefined) => {
    if (d == undefined) {
      field.onChange(undefined);
      return;
    }
    if (!DateUtils.isDateInRange(d, rangeObj, true)) return;
    field.onChange(valueAs === "iso" ? d.toISOString() : d);
  };

  const commitIfComplete = (
    next: Date,
    nextPicked: { date: boolean; time: boolean }
  ) => {
    if (!requireTime || (nextPicked.date && nextPicked.time)) {
      commit(next);
    }
  };

  /* Ограничители */
  const isDayDisabled = (date: Date) =>
    DateUtils.isDayDisabled(date, rangeObj, disabledDates);

  const isMonthDisabled = (y: number, m0: number) => {
    const first = new Date(y, m0, 1);
    const last = new Date(y, m0 + 1, 0);
    if (minDate && DateUtils.stripTime(last) < DateUtils.stripTime(minDate))
      return true;
    if (maxDate && DateUtils.stripTime(first) > DateUtils.stripTime(maxDate))
      return true;
    return false;
  };

  /** Запрещён ли конкретный момент (min/max + кастомный disabledTimes) */
  const isDateTimeDisabled = (dt: Date) => {
    if (!DateUtils.isDateInRange(dt, rangeObj, true)) return true;
    return false;
  };

  /** Целиком ли запрещён час для текущего draft-дня с учётом нижней границы */
  const isHourCompletelyDisabled = (hour: number) => {
    const lower = getLowerBoundForDraft();
    if (lower) {
      // ниже минимального часа — запрещаем целиком
      if (hour < lower.minHour) return true;

      if (hour === lower.minHour) {
        // в минимальном часу проверяем, есть ли хоть одна минута >= выровненной
        if (lower.minMinuteStepAligned > 59) return true; // всё в этом часу «в прошлом»
        for (let i = 0; i < Math.floor(60 / minuteStep); i++) {
          const m = i * minuteStep;
          if (m < lower.minMinuteStepAligned) continue;
          const probe = new Date(
            draft.getFullYear(),
            draft.getMonth(),
            draft.getDate(),
            hour,
            m
          );
          if (!isDateTimeDisabled(probe)) return false; // нашли доступную минуту
        }
        return true; // нет доступных минут в этом часу
      }
      // hour > minHour — проверим обычной логикой
    }

    // общий случай: есть ли в этом часу хоть одна доступная минута
    for (let i = 0; i < Math.floor(60 / minuteStep); i++) {
      const m = i * minuteStep;
      const probe = new Date(
        draft.getFullYear(),
        draft.getMonth(),
        draft.getDate(),
        hour,
        m
      );
      if (!isDateTimeDisabled(probe)) return false;
    }
    return true;
  };

  /** Запрещена ли конкретная минута для выбранного draft-часа */
  const isMinuteDisabled = (minute: number) => {
    const lower = getLowerBoundForDraft();

    // если это минимальный час — блокируем минуты ниже нижней границы (с выравниванием по шагу)
    if (lower && draft.getHours() === lower.minHour) {
      if (minute < lower.minMinuteStepAligned) return true;
    }
    // если час ниже минимального — сюда не дойдём (час уже дизейблим целиком)

    const probe = new Date(
      draft.getFullYear(),
      draft.getMonth(),
      draft.getDate(),
      draft.getHours(),
      minute
    );
    return isDateTimeDisabled(probe);
  };

  /** Сервиска: одинаковый ли календарный день */
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  /** Округление минуты вверх к шагу (ceil), чтобы не давать минуту меньше min */
  const roundUpToStep = useCallback(
    (minute: number, step: number) =>
      Math.min(59, Math.ceil(minute / step) * step),
    []
  );

  /** нижняя граница: мин. час и мин. минута для текущего draft-дня */
  const getLowerBoundForDraft = () => {
    if (!minDate) return null;
    if (!isSameDay(draft, minDate)) return null;
    return {
      minHour: minDate.getHours(),
      // если шаг 5, а минимально 12:02 — разрешать с 12:05
      minMinuteStepAligned: roundUpToStep(minDate.getMinutes(), minuteStep),
    };
  };

  /* Обработчики частей */
  const handleDateSelect = (dayNum: number) => {
    // визуально — подсветить выбранный день
    const vis = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth(),
      NumberUtils.clamp(dayNum, 1, 31),
      0,
      0
    );

    setDisplayDate(DateUtils.startOfMonth(vis));

    // обновить черновик и, возможно, закоммитить
    setDraft(() => {
      const next = new Date(vis);
      setPicked({ date: true, time: false });
      setHourTouched(false);
      setMinuteTouched(false);
      return next;
    });
  };

  const setHour = (hour: number) => {
    setDraft((prev) => {
      const h = NumberUtils.clamp(hour, 0, 23);
      const next = new Date(
        prev.getFullYear(),
        prev.getMonth(),
        prev.getDate(),
        h,
        0
      );

      if (isDateTimeDisabled(next)) return prev;

      // ВАЖНО: не считаем, что time выбран — ждём минуту
      setPicked((p) => ({ ...p, date: true, time: false }));
      setHourTouched(true);
      setMinuteTouched(false);
      return next;
    });
  };

  const setMinute = (minute: number) => {
    setDraft((prev) => {
      const m = NumberUtils.clamp(minute, 0, 59);
      const next = new Date(
        prev.getFullYear(),
        prev.getMonth(),
        prev.getDate(),
        prev.getHours(),
        m
      );

      if (isDateTimeDisabled(next)) return prev;

      // Теперь выбор времени завершён
      setPicked((p) => {
        const nextPicked = { ...p, date: true, time: true };
        // Коммитим ТОЛЬКО здесь (минуты)
        commitIfComplete(next, nextPicked);
        return nextPicked;
      });
      setMinuteTouched(true);
      return next;
    });
  };

  const handleMonthChange = (m0: number) => {
    if (isMonthDisabled(displayDate.getFullYear(), m0)) return;

    const next = new Date(displayDate.getFullYear(), m0, 1);

    setDisplayDate(DateUtils.startOfMonth(next));
    // поддержим черновик для подсветки времени
    setDraft(
      (prev) =>
        new Date(
          next.getFullYear(),
          next.getMonth(),
          prev.getDate(),
          prev.getHours(),
          prev.getMinutes()
        )
    );
    setView("date");
  };

  const handleYearChange = (year: number) => {
    const next = new Date(year, displayDate.getMonth(), 1);
    setDisplayDate(DateUtils.startOfMonth(next));
    setDraft(
      (prev) =>
        new Date(
          next.getFullYear(),
          next.getMonth(),
          prev.getDate(),
          prev.getHours(),
          prev.getMinutes()
        )
    );
  };

  const navigateMonth = (dir: number) =>
    setDisplayDate((d) => DateUtils.addMonths(d, dir));

  // Внутри компонента
  const resetFromSelected = () => {
    // база: либо selected, либо min/now как в useEffect
    const base =
      selected ??
      (minDate
        ? new Date(Math.max(Date.now(), minDate.getTime()))
        : new Date());

    const normalized = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      base.getHours(),
      Math.floor(base.getMinutes() / minuteStep) * minuteStep
    );

    setDisplayDate(DateUtils.startOfMonth(base));
    setDraft(normalized);
    const has = !!selected;
    setPicked({ date: has, time: has });
  };

  // Локальные подсказки/ошибки (по желанию)
  let localError: string | undefined;
  if (selected) {
    if (minDate && selected < minDate)
      localError = "Date/time early than may be.";
    else if (maxDate && selected > maxDate)
      localError = "Date/time late than may be.";
    else if (requireTime && (!picked.time || isNaN(selected.getTime())))
      localError = "Please choose date and time.";
  }
  const hasError = !!(hasZodError || localError);
  const errorMessage = (hasZodError ? zodErrorMsg : localError) ?? undefined;

  const idSafe = id ?? String(name);
  const weekdays = useMemo(
    () => weekdaysShortMonFirst(displayLocale),
    [displayLocale]
  );

  // grid days для текущего месяца
  const daysGrid = useMemo(() => buildDaysGrid(displayDate), [displayDate]);

  const yearRange = useMemo(() => DateUtils.getYearRange(rangeObj), [rangeObj]);

  const clear = () => commit(undefined);

  // Формат отображения draft-значения в триггере (когда дата/час выбраны, а минут ещё нет)
  const selectingTime = requireTime && picked.date && !picked.time;

  const formattedDraft = useMemo(() => {
    if (!selectingTime) return "";
    const datePart = new Intl.DateTimeFormat(displayLocale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(draft);

    // если час уже выбран — показываем HH:--, иначе --:--
    const hasHour = Number.isInteger(draft.getHours());
    const timePart = hasHour
      ? `${NumberUtils.pad2(draft.getHours())}:--`
      : `--:--`;

    return `${datePart} / ${timePart}`;
  }, [selectingTime, draft, displayLocale]);

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

      {/* Обёртка ввода */}
      <div className="relative min-h-12">
        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              // закрывают поповер
              const incomplete = requireTime && picked.date && !picked.time; // дата выбрана, время нет
              if (incomplete) {
                resetFromSelected(); // откатить незавершённый драфт
              }
            }
            setOpen(nextOpen);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              id={idSafe}
              variant="outline"
              disabled={disabled}
              aria-invalid={hasError || undefined}
              className={cn(
                "w-full justify-start text-left font-normal min-h-12",
                "rounded-md border-neutral-100 border-solid border-1.5",
                {
                  "pl-10": withLeftIcon,
                  "text-red-500 border-red-300": hasError,
                },
                className
              )}
            >
              {withLeftIcon && (
                <CalendarIcon className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              )}
              {selectingTime ? (
                // Черновой режим: мягкая подсветка и курсив, чтобы отличалось от финального значения
                <span className="italic text-blue-700">
                  {formattedDraft}
                  <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs not-italic text-blue-700 align-middle">
                    draft
                  </span>
                </span>
              ) : formatted ? (
                formatted
              ) : (
                <span className="text-gray-300">{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="center"
            side="bottom"
            sideOffset={20}
            className="py-2 px-3 w-96 grid grid-cols-[1fr_5px_5.25rem] gap-1"
          >
            {/* Левая часть: календарь / месяц-год */}
            <div className="flex flex-col gap-2">
              {/* Header */}
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
                  className="rounded-full cursor-pointer px-2 py-1 bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
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
                  {/* Дни недели */}
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
                  {/* Сетка дней */}
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

                      // draft active (новая логика): подсветка дня, если дата выбрана,
                      // но время ещё не выбрано (или requireTime=true)
                      const isDraftActive =
                        !isEmpty &&
                        picked.date && // уже кликнули дату
                        !picked.time &&
                        requireTime && // но не выбрали время
                        draft.getFullYear() === displayDate.getFullYear() &&
                        draft.getMonth() === displayDate.getMonth() &&
                        draft.getDate() === (d as number);

                      const isActive =
                        !isEmpty &&
                        !!selected &&
                        selected.getFullYear() === displayDate.getFullYear() &&
                        selected.getMonth() === displayDate.getMonth() &&
                        selected.getDate() === (d as number);

                      const isDisabled =
                        isEmpty || (dayDate && isDayDisabled(dayDate));

                      return (
                        <GridItem
                          key={idx}
                          value={isEmpty ? " " : String(d)}
                          isActive={!!isActive}
                          isDisabled={!!isDisabled}
                          isEmpty={isEmpty}
                          isDraft={isDraftActive}
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
                  {/* Годы */}
                  <ScrollArea className="h-52 w-full">
                    <ul className="flex flex-col gap-1 p-1">
                      {NumberUtils.range(yearRange.end - yearRange.start + 1)
                        .map((i) => yearRange.start + i)
                        .filter((y) => DateUtils.isYearInRange(y, rangeObj))
                        .map((y) => {
                          const isDraftActive =
                            picked.date &&
                            !picked.time &&
                            requireTime &&
                            draft.getFullYear() === y;

                          const isActive =
                            !!selected && selected.getFullYear() === y;
                          return (
                            <GridItem
                              key={y}
                              value={String(y)}
                              isActive={isActive}
                              onClick={() => handleYearChange(y)}
                              isDraft={isDraftActive}
                            />
                          );
                        })}
                    </ul>
                  </ScrollArea>

                  {/* Месяцы */}
                  <ScrollArea className="h-52 w-full">
                    <ul className="flex flex-col gap-1 p-1">
                      {NumberUtils.range(12)
                        .filter((m0) =>
                          DateUtils.isMonthInRange(
                            displayDate.getFullYear(),
                            m0,
                            rangeObj
                          )
                        )
                        .map((m0) => {
                          const disabledMonth = isMonthDisabled(
                            displayDate.getFullYear(),
                            m0
                          );
                          const isActive =
                            !!selected &&
                            selected.getFullYear() ===
                              displayDate.getFullYear() && // не подсвечивать «тот же месяц» в другом году
                            selected.getMonth() === m0;

                          const isDraftActive =
                            picked.date &&
                            !picked.time &&
                            requireTime &&
                            draft.getFullYear() === displayDate.getFullYear() &&
                            draft.getMonth() === m0;

                          return (
                            <GridItem
                              key={m0}
                              value={DateUtils.getMonthShort(m0, displayLocale)}
                              isActive={isActive}
                              isDisabled={disabledMonth}
                              isDraft={isDraftActive}
                              onClick={() =>
                                !disabledMonth && handleMonthChange(m0)
                              }
                            />
                          );
                        })}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Разделитель */}
            <div className="mx-0.5 my-0.5 h-full w-px bg-neutral-300" />

            {/* Правая часть: время */}
            <div className="w-22 flex flex-col gap-2">
              <span className="text-base text-center select-none">Time</span>
              <div className="grid grid-cols-[2.75rem_2.75rem] w-full">
                {/* Hours */}
                <ScrollArea className="h-56">
                  <ul className="flex flex-col gap-1 p-1">
                    {NumberUtils.range(24).map((h) => {
                      const disabledHour = isHourCompletelyDisabled(h);

                      // если мы в процессе выбора (дата выбрана, минута ещё нет) — не подсвечиваем старый selected
                      const selectingTime =
                        requireTime && picked.date && !picked.time;

                      const active =
                        !!selected &&
                        !selectingTime &&
                        selected.getHours() === h;

                      const draftActive =
                        selectingTime && hourTouched && draft.getHours() === h;

                      return (
                        <GridItem
                          key={h}
                          value={NumberUtils.pad2(h)}
                          isActive={active}
                          isDisabled={disabledHour}
                          isDraft={draftActive}
                          // клики только если час доступен
                          onClick={() => !disabledHour && setHour(h)}
                        />
                      );
                    })}
                  </ul>
                </ScrollArea>
                {/* Minutes */}
                <ScrollArea className="h-56">
                  <ul className="flex flex-col gap-1 p-1">
                    {NumberUtils.range(Math.floor(60 / minuteStep)).map((i) => {
                      const m = i * minuteStep;
                      const disabledMinute = isMinuteDisabled(m);

                      const selectingTime =
                        requireTime && picked.date && !picked.time;

                      const active =
                        !!selected &&
                        !selectingTime &&
                        selected.getMinutes() === m;

                      const draftActive =
                        selectingTime &&
                        hourTouched &&
                        !minuteTouched &&
                        draft.getMinutes() === m;

                      return (
                        <GridItem
                          key={m}
                          value={NumberUtils.pad2(m)}
                          isActive={active}
                          isDraft={draftActive}
                          isDisabled={disabledMinute}
                          onClick={() => !disabledMinute && setMinute(m)}
                          className={cn({
                            "opacity-50 cursor-not-allowed": disabledMinute,
                          })}
                        />
                      );
                    })}
                  </ul>
                </ScrollArea>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {withClearButton && formatted && !disabled && (
          <ClearButton visible onClear={clear} />
        )}
      </div>

      <FieldDescription id={`${idSafe}-desc`} error={hasError}>
        {requireTime && picked.date && !picked.time
          ? draft.getHours() == null
            ? "Date selected. Now choose hour."
            : "Hour selected. Now choose minutes to apply."
          : description}
      </FieldDescription>

      <FieldError id={`${idSafe}-msg`}>{errorMessage}</FieldError>
    </div>
  );
}
