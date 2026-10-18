import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayEpochDay, epochDayToDate } from '../../utils/dateUtils';

interface WeekCalendarProps {
    selectedEpochDay: number;
    onSelectDate: (epoch: number) => void;
    weekOffset: number;
    onWeekOffsetChange: (offset: number) => void;
}

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
                                                              selectedEpochDay,
                                                              onSelectDate,
                                                              weekOffset,
                                                              onWeekOffsetChange,
                                                          }) => {
    const todayEpoch = getTodayEpochDay();
    const todayDate = epochDayToDate(todayEpoch);

    const dayOfWeek = todayDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mondayEpoch = todayEpoch - diffToMonday + weekOffset * 7;

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const epoch = mondayEpoch + i;
        const date = epochDayToDate(epoch);
        return {
            epoch,
            date,
            dayName: ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'][date.getDay()],
            dayNumber: date.getDate(),
        };
    });

    const selectedIndex = weekDays.findIndex((d) => d.epoch === selectedEpochDay);
    const monthYearStr = weekDays[0].date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    const monthYearCap = monthYearStr.charAt(0).toUpperCase() + monthYearStr.slice(1);

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
        <span className="text-[17px] font-bold text-text-primary-dark tracking-tight whitespace-nowrap">
          {monthYearCap}
        </span>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => onWeekOffsetChange(weekOffset - 1)} className="p-1.5 rounded-lg text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors">
                        <ChevronLeft size={18} />
                    </button>
                    <button onClick={() => { onWeekOffsetChange(0); onSelectDate(todayEpoch); }} className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-item-dark text-text-primary-dark border border-border-dark hover:border-text-secondary-dark transition-colors shadow-sm">
                        Сегодня
                    </button>
                    <button onClick={() => onWeekOffsetChange(weekOffset + 1)} className="p-1.5 rounded-lg text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="relative flex w-full z-0">
                <div
                    className={`absolute top-0 bottom-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] z-0 ${
                        selectedIndex === -1 ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
                    }`}
                    style={{ width: `${100 / 7}%`, transform: `translateX(${selectedIndex * 100}%)`, padding: '0 4px' }}
                >
                    {/* Строгая плашка активного дня */}
                    <div className="w-full h-full bg-text-primary-dark rounded-[14px] shadow-md" />
                </div>

                {weekDays.map((day) => {
                    const isSelected = day.epoch === selectedEpochDay;
                    const isToday = day.epoch === todayEpoch;

                    return (
                        <div key={day.epoch} className="flex-1 px-[4px] relative z-10">
                            <button
                                onClick={() => onSelectDate(day.epoch)}
                                className={`w-full flex flex-col items-center justify-center py-2.5 rounded-[14px] border transition-colors duration-300 ${
                                    isSelected ? 'border-transparent' : 'border-border-dark bg-transparent hover:border-white/10 hover:bg-item-dark/30'
                                }`}
                            >
                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors duration-300 ${isSelected ? 'text-bg-dark opacity-90' : isToday ? 'text-text-primary-dark' : 'text-text-secondary-dark'}`}>
                  {day.dayName}
                </span>
                                <span className={`text-[18px] leading-none tracking-tight transition-colors duration-300 ${isSelected ? 'text-bg-dark font-black' : isToday ? 'text-text-primary-dark font-black' : 'text-text-primary-dark font-bold'}`}>
                  {day.dayNumber}
                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};