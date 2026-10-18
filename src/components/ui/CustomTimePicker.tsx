import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CustomTimePickerProps {
    value: string;
    onChange: (v: string) => void;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const currentHour = value ? value.split(':')[0] : null;
    const currentMin = value ? value.split(':')[1] : null;

    const hourRef = useRef<HTMLDivElement>(null);
    const minRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                hourRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                minRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 50);
        }
    }, [isOpen]);

    const hours = Array.from({ length: 24 }).map((_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }).map((_, i) => i.toString().padStart(2, '0'));

    const handleHourClick = (h: string) => onChange(`${h}:${currentMin || '00'}`);
    const handleMinClick = (m: string) => onChange(`${currentHour || '12'}:${m}`);

    return (
        <div className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-item-dark border rounded-[14px] px-4 py-3.5 text-[15px] outline-none cursor-pointer flex items-center justify-between transition-colors ${
                    isOpen ? 'border-text-primary-dark text-text-primary-dark' : 'border-border-dark text-text-primary-dark hover:border-text-secondary-dark'
                }`}
            >
        <span className={value ? 'text-text-primary-dark font-mono font-bold' : 'text-text-secondary-dark font-medium'}>
          {value || '--:--'}
        </span>
                <Clock size={16} className={isOpen ? 'text-text-primary-dark' : 'text-text-secondary-dark'} />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 w-full bg-card-dark border border-border-dark rounded-[16px] shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex w-full h-[200px]">
                            <div className="flex-1 overflow-y-auto custom-scrollbar border-r border-border-dark relative">
                                <div className="py-20" />
                                {hours.map(h => (
                                    <div
                                        key={`h-${h}`}
                                        ref={currentHour === h ? hourRef : null}
                                        onClick={() => handleHourClick(h)}
                                        className={`px-0 py-2 text-center text-[16px] font-mono cursor-pointer transition-colors ${
                                            currentHour === h ? 'bg-text-primary-dark text-bg-dark font-black scale-105' : 'text-text-secondary-dark hover:bg-item-dark hover:text-text-primary-dark'
                                        }`}
                                    >
                                        {h}
                                    </div>
                                ))}
                                <div className="py-20" />
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                                <div className="py-20" />
                                {minutes.map(m => (
                                    <div
                                        key={`m-${m}`}
                                        ref={currentMin === m ? minRef : null}
                                        onClick={() => handleMinClick(m)}
                                        className={`px-0 py-2 text-center text-[16px] font-mono cursor-pointer transition-colors ${
                                            currentMin === m ? 'bg-text-primary-dark text-bg-dark font-black scale-105' : 'text-text-secondary-dark hover:bg-item-dark hover:text-text-primary-dark'
                                        }`}
                                    >
                                        {m}
                                    </div>
                                ))}
                                <div className="py-20" />
                            </div>
                        </div>
                        <div className="p-1 border-t border-border-dark bg-item-dark">
                            <button onClick={() => { onChange(''); setIsOpen(false); }} className="w-full py-2.5 text-[13px] font-bold text-text-secondary-dark hover:text-[#ef4444] rounded-lg transition-colors">
                                Очистить время
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};