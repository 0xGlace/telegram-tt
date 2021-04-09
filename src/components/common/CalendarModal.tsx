import React, {
  FC, memo, useState, useEffect, useMemo, useCallback,
} from '../../lib/teact/teact';

import buildClassName from '../../util/buildClassName';
import {
  formatMonthAndYear, formatHumanDate, formatTime,
} from '../../util/dateFormat';
import { IS_MOBILE_SCREEN } from '../../util/environment';

import Modal from '../ui/Modal';
import Button from '../ui/Button';

import './CalendarModal.scss';

export type OwnProps = {
  selectedAt?: number;
  maxAt?: number;
  isFutureMode?: boolean;
  isPastMode?: boolean;
  isOpen: boolean;
  withTimePicker?: boolean;
  submitButtonLabel?: string;
  secondButtonLabel?: string;
  onClose: () => void;
  onSubmit: (date: Date) => void;
  onSecondButtonClick?: NoneToVoidFunction;
};

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const CalendarModal: FC<OwnProps> = ({
  selectedAt,
  maxAt,
  isFutureMode,
  isPastMode,
  isOpen,
  withTimePicker,
  submitButtonLabel,
  secondButtonLabel,
  onClose,
  onSubmit,
  onSecondButtonClick,
}) => {
  const now = new Date();
  const defaultSelectedDate = useMemo(() => (selectedAt ? new Date(selectedAt) : new Date()), [selectedAt]);
  const maxDate = maxAt ? new Date(maxAt) : undefined;

  const [selectedDate, setSelectedDate] = useState<Date>(defaultSelectedDate);
  const [selectedHours, setSelectedHours] = useState<string>(
    formatInputTime(defaultSelectedDate.getHours()),
  );
  const [selectedMinutes, setSelectedMinutes] = useState<string>(
    formatInputTime(defaultSelectedDate.getMinutes()),
  );

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  const currentDate = selectedDate.getDate();

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(defaultSelectedDate);
    }
  }, [isOpen, defaultSelectedDate]);

  const shouldDisableNextMonth = (isPastMode && currentYear >= now.getFullYear() && currentMonth >= now.getMonth())
    || (maxDate && currentYear >= maxDate.getFullYear() && currentMonth >= maxDate.getMonth());
  const shouldDisablePrevMonth = isFutureMode && currentYear <= now.getFullYear() && currentMonth <= now.getMonth();

  const calendarGrid = useMemo(() => (
    buildCalendarGrid(currentYear, currentMonth)
  ), [currentMonth, currentYear]);

  function handlePrevMonth() {
    setSelectedDate((d) => {
      const dateCopy = new Date(d);
      dateCopy.setMonth(dateCopy.getMonth() - 1);

      return dateCopy;
    });
  }

  function handleNextMonth() {
    setSelectedDate((d) => {
      const dateCopy = new Date(d);
      dateCopy.setMonth(dateCopy.getMonth() + 1);

      return dateCopy;
    });
  }

  function handleDateSelect(date: number) {
    setSelectedDate((d) => {
      const dateCopy = new Date(d);
      dateCopy.setDate(date);

      return dateCopy;
    });
  }

  function handleSubmit() {
    onSubmit(selectedDate);
  }

  const handleChangeHours = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]+/g, '');
    if (!value.length) {
      setSelectedHours('');
      e.target.value = '';
      return;
    }

    const hours = Math.max(0, Math.min(Number(value), 23));

    const date = new Date(selectedDate.getTime());
    date.setHours(hours);
    setSelectedDate(date);

    const hoursStr = formatInputTime(hours);
    setSelectedHours(hoursStr);
    e.target.value = hoursStr;
  }, [selectedDate]);

  const handleChangeMinutes = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]+/g, '');
    if (!value.length) {
      setSelectedMinutes('');
      e.target.value = '';
      return;
    }

    const minutes = Math.max(0, Math.min(Number(value), 59));

    const date = new Date(selectedDate.getTime());
    date.setMinutes(minutes);
    setSelectedDate(date);

    const minutesStr = formatInputTime(minutes);
    setSelectedMinutes(minutesStr);
    e.target.value = minutesStr;
  }, [selectedDate]);

  function renderTimePicker() {
    return (
      <div className="timepicker">
        <input
          type="text"
          className="form-control"
          inputMode="decimal"
          value={selectedHours}
          onChange={handleChangeHours}
        />
        :
        <input
          type="text"
          className="form-control"
          inputMode="decimal"
          value={selectedMinutes}
          onChange={handleChangeMinutes}
        />
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="CalendarModal"
    >
      <div className="container">
        <div className="month-selector">
          <Button
            round
            size="smaller"
            color="translucent"
            onClick={onClose}
          >
            <i className="icon-close" />
          </Button>

          <h4>
            {formatMonthAndYear(selectedDate, IS_MOBILE_SCREEN)}
          </h4>

          <Button
            round
            size="smaller"
            color="translucent"
            disabled={shouldDisablePrevMonth}
            onClick={!shouldDisablePrevMonth ? handlePrevMonth : undefined}
          >
            <i className="icon-previous" />
          </Button>

          <Button
            round
            size="smaller"
            color="translucent"
            disabled={shouldDisableNextMonth}
            onClick={!shouldDisableNextMonth ? handleNextMonth : undefined}
          >
            <i className="icon-next" />
          </Button>
        </div>
      </div>

      <div className="calendar-wrapper">
        <div className="calendar-grid">
          {WEEKDAY_LETTERS.map((letter) => (
            <div className="day-button faded weekday">
              <span>{letter}</span>
            </div>
          ))}
          {calendarGrid.map((gridDate) => (
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleDateSelect(gridDate)}
              className={buildClassName(
                'day-button',
                isDisabledDay(
                  currentYear, currentMonth, gridDate, isFutureMode ? now : undefined, isPastMode ? now : maxDate,
                )
                  ? 'disabled'
                  : `${gridDate ? 'clickable' : ''}`,
                gridDate === currentDate && 'selected',
              )}
            >
              {!!gridDate && (
                <span>{gridDate}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {withTimePicker && renderTimePicker()}

      <div className="footer">
        <Button onClick={handleSubmit}>
          {withTimePicker ? formatSubmitLabel(selectedDate) : submitButtonLabel}
        </Button>
        {secondButtonLabel && (
          <Button onClick={onSecondButtonClick} isText>
            {secondButtonLabel}
          </Button>
        )}
      </div>
    </Modal>
  );
};

function buildCalendarGrid(year: number, month: number) {
  const grid: number[] = [];

  const date = new Date();
  date.setFullYear(year);
  date.setMonth(month);
  date.setDate(1);

  const monthStartDay = date.getDay();
  // Fill empty cells
  for (let i = 1; i < monthStartDay; i++) {
    grid.push(0);
  }

  while (date.getMonth() === month) {
    const gridDate = date.getDate();
    grid.push(gridDate);
    date.setDate(gridDate + 1);
  }

  return grid;
}

function isDisabledDay(year: number, month: number, day: number, minDate?: Date, maxDate?: Date) {
  const selectedDay = new Date(year, month, day, 0, 0, 0, 0);
  const fixedMinDate = minDate && new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate(), 0, 0, 0, 0);
  const fixedMaxDate = maxDate && new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate(), 0, 0, 0, 0);

  if (fixedMaxDate && selectedDay > fixedMaxDate) {
    return true;
  } else if (fixedMinDate && selectedDay < fixedMinDate) {
    return true;
  }

  return false;
}

function formatInputTime(value: string | number) {
  return String(value).padStart(2, '0');
}

function formatSubmitLabel(date: Date) {
  const day = formatHumanDate(date, true);

  return `Send ${day === 'Today' ? day : `on ${day}`} at ${formatTime(date)}`;
}

export default memo(CalendarModal);
