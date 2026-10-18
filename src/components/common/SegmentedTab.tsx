import React from 'react';

interface SegmentedTabProps {
    items: string[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    activeColor?: string;
}

export const SegmentedTab: React.FC<SegmentedTabProps> = ({
                                                              items,
                                                              selectedIndex,
                                                              onSelect,
                                                          }) => {
    return (
        <div className="flex bg-item-dark p-1 rounded-pill border border-border-dark w-full select-none">
            {items.map((item, index) => {
                const isSelected = selectedIndex === index;
                return (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onSelect(index)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 text-center ${
                            isSelected
                                ? 'bg-accent text-white shadow-sm'
                                : 'text-text-secondary-dark hover:text-text-primary-dark'
                        }`}
                    >
                        {item}
                    </button>
                );
            })}
        </div>
    );
};