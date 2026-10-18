import React, { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "./Modal";

interface CustomDatePickerProps {
  value: string;
  onChange: (v: string) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, isOpen, setIsOpen }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const dateObj = new Date(year, month - 1, d);
    days.push({ dayNum: d, dateObj, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    days.push({ dayNum: d, dateObj, isCurrentMonth: true });
  }
  const totalCells = days.length <= 35 ? 35 : 42;
  for (let d = 1; days.length < totalCells; d++) {
    const dateObj = new Date(year, month + 1, d);
    days.push({ dayNum: d, dateObj, isCurrentMonth: false });
  }

  const handleSelect = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${day}`);
    setIsOpen(false);
  };

  const formatDateDisplay = (val: string) => {
    if (!val) return 'Выберите дату';
    const [y, m, d] = val.split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="w-full bg-transparent flex items-center gap-3 text-[15px] font-medium text-text-primary-dark outline-none cursor-pointer select-none"
      >
        <CalendarIcon size={18} className="text-text-secondary-dark transition-colors duration-300" />
        <span className="flex-1">{formatDateDisplay(value)}</span>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {isOpen && (
          <div className="bg-card-dark border border-border-dark rounded-[24px] p-6 lg:p-8 w-full max-w-sm flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-bold text-text-primary-dark tracking-tight">
                {monthNames[month]} {year}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {weekDays.map(wd => (
                <span key={wd} className="text-[11px] font-bold text-text-secondary-dark uppercase tracking-wider mb-2">
                  {wd}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {days.map((item, idx) => {
                const y = item.dateObj.getFullYear();
                const m = String(item.dateObj.getMonth() + 1).padStart(2, '0');
                const d = String(item.dateObj.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;
                const isSelected = value === dateStr;
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item.dateObj)}
                    className={`h-10 rounded-xl flex items-center justify-center text-[14px] font-semibold transition-all duration-200 ${
                      isSelected
                        ? 'bg-text-primary-dark text-bg-dark font-bold shadow-md scale-110 z-10'
                        : isToday
                        ? 'border border-border-dark text-text-primary-dark'
                        : item.isCurrentMonth
                        ? 'text-text-primary-dark hover:bg-item-dark hover:scale-110 z-10'
                        : 'text-text-secondary-dark/40 hover:bg-item-dark/50'
                    }`}
                  >
                    {item.dayNum}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 mt-2 border-t border-border-dark flex justify-between items-center gap-3">
              <button 
                onClick={() => {
                  const today = new Date();
                  handleSelect(today);
                  setCurrentDate(today);
                }}
                className="px-4 py-3 rounded-xl text-[14px] font-semibold text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors"
              >
                Сегодня
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 rounded-xl bg-text-primary-dark text-bg-dark text-[14px] font-bold shadow-md hover:opacity-90 transition-opacity"
              >
                Готово
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
