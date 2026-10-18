import React, { useState } from 'react';
import type { Task } from '../../types';
import { epochDayToDate, dateToEpochDay } from '../../utils/dateUtils';

interface RescheduleModalProps {
    task: Task;
    onClose: () => void;
    onConfirm: (n: number) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({ task, onClose, onConfirm }) => {
    const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
        const d = epochDayToDate(task.dateEpochDay);
        return d.toISOString().split('T')[0];
    });

    const handleApply = () => {
        const parts = selectedDateStr.split('-');
        if (parts.length === 3) {
            onConfirm(dateToEpochDay(new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]))));
        }
    };

    return (
        <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 w-full max-w-sm flex flex-col gap-5 shadow-2xl">
            <div className="flex flex-col gap-2">
                <h3 className="text-[20px] font-bold text-text-primary-dark tracking-tight">Перенос</h3>
                <p className="text-[14px] text-text-secondary-dark truncate font-medium">«{task.title}»</p>
            </div>
            <div className="relative mt-2">
                <input
                    type="date"
                    value={selectedDateStr}
                    onChange={(e) => setSelectedDateStr(e.target.value)}
                    className="w-full bg-item-dark border border-border-dark rounded-[14px] px-4 py-3.5 text-[15px] text-text-primary-dark outline-none focus:border-text-primary-dark transition-colors cursor-pointer"
                />
            </div>
            <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-[14px] font-medium rounded-lg text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors">
                    Отмена
                </button>
                <button type="button" onClick={handleApply} className="px-6 py-2.5 text-[14px] font-bold rounded-lg bg-text-primary-dark text-bg-dark shadow-md hover:opacity-90 transition-opacity">
                    Перенести
                </button>
            </div>
        </div>
    );
};