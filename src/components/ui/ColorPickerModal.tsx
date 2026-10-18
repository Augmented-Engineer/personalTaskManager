import React from 'react';
import { Modal } from './Modal';
import { Check, X } from 'lucide-react';

const ACCENT_COLORS = [
    { name: 'Монохром', value: 'theme-adaptive' }, // Наш новый динамический цвет
    { name: 'Синий', value: '#3b82f6' },
    { name: 'Коралловый', value: '#FF4D5E' },
    { name: 'Изумрудный', value: '#10b981' },
    { name: 'Фиолетовый', value: '#8b5cf6' },
    { name: 'Оранжевый', value: '#f97316' },
];

interface ColorPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentColor: string;
    onSelectColor: (color: string) => void;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
                                                                      isOpen, onClose, currentColor, onSelectColor
                                                                  }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-card-dark border border-border-dark rounded-[24px] p-6 lg:p-8 w-full max-w-sm flex flex-col gap-6 shadow-2xl">
                <div className="flex justify-between items-center">
                    <h3 className="text-[20px] font-bold text-text-primary-dark tracking-tight">Акцентный цвет</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {ACCENT_COLORS.map(color => {
                        const isAdaptive = color.value === 'theme-adaptive';
                        const isSelected = currentColor === color.value;

                        // Если адаптивный, берем основной цвет текста (белый в темной, черный в светлой)
                        const displayColor = isAdaptive ? 'var(--text-primary)' : color.value;

                        return (
                            <button
                                key={color.value}
                                onClick={() => { onSelectColor(color.value); onClose(); }}
                                className={`flex flex-col items-center gap-2.5 p-3 rounded-[16px] border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                    isSelected ? 'bg-item-dark border-text-primary-dark scale-[0.98]' : 'bg-transparent border-transparent hover:bg-item-dark/50'
                                }`}
                            >
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 border border-border-dark"
                                    style={{
                                        backgroundColor: displayColor,
                                        boxShadow: isSelected ? (isAdaptive ? '0 0 16px rgba(128,128,128,0.3)' : `0 0 16px ${color.value}60`) : 'none'
                                    }}
                                >
                                    {/* В адаптивном режиме галочка должна быть цвета фона, чтобы контрастировать */}
                                    {isSelected && <Check size={18} className={isAdaptive ? 'text-bg-dark' : 'text-white'} strokeWidth={3} />}
                                </div>
                                <span className={`text-[12px] font-semibold transition-colors ${isSelected ? 'text-text-primary-dark' : 'text-text-secondary-dark'}`}>
                  {color.name}
                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};