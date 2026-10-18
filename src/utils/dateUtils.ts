// Получение текущего epochDay (дни с 01.01.1970 UTC)
export function getTodayEpochDay(): number {
    const now = new Date();
    return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
}

// Преобразование epochDay в объект Date
export function epochDayToDate(epochDay: number): Date {
    return new Date(epochDay * 86400000);
}

// Преобразование объекта Date в epochDay
export function dateToEpochDay(date: Date): number {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

// Форматирование даты: "15 октября"
export function formatDayMonth(epochDay: number): string {
    const date = epochDayToDate(epochDay);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// Полный день недели с заглавной: "Пятница, 16 октября"
export function formatHeaderDate(epochDay: number): string {
    const date = epochDayToDate(epochDay);
    const weekday = date.toLocaleDateString('ru-RU', { weekday: 'long' });
    const dayMonth = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dayMonth}`;
}

// Получение дат текущей недели (пн-вс) для переданного смещения недель
export function getWeekDates(weekOffset: number = 0): Date[] {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0 = Понедельник
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + weekOffset * 7);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push(d);
    }
    return days;
}
export const dateStrToEpochDay = (dateStr: string): number => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const targetDate = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
    return dateToEpochDay(targetDate);
  }
  return getTodayEpochDay();
};

export const epochDayToDateStr = (epochDay: number): string => {
  const d = epochDayToDate(epochDay);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};
