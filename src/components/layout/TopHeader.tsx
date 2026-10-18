import React from 'react';
import { Menu, Palette, Sun, Moon } from 'lucide-react';
import { formatHeaderDate, getTodayEpochDay } from '../../utils/dateUtils';

interface TopHeaderProps {
  title: string;
  onOpenMenu: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenColors: () => void;
  subtitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title, onOpenMenu, isDark, onToggleTheme, onOpenColors, subtitle
}) => {
  return (
    <header className="flex flex-row items-start justify-between pb-5 pt-2 select-none w-full">
      <div className="flex flex-col gap-1 text-left">
        <div className="flex items-center gap-2">
          {/* Гамбургер виден только на телефонах (md:hidden) */}
          <button 
            onClick={onOpenMenu} 
            className="md:hidden text-text-secondary-dark hover:text-text-primary-dark transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="text-[13px] font-medium text-text-secondary-dark">
            {subtitle || formatHeaderDate(getTodayEpochDay())}
          </span>
        </div>
        <h1 className="text-[28px] leading-none font-black text-text-primary-dark tracking-tight mt-1.5">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          onClick={onOpenColors}
          className="w-9 h-9 rounded-full bg-item-dark border border-border-dark flex items-center justify-center text-accent hover:opacity-80 transition"
          title="Палитра тем"
        >
          <Palette size={16} />
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-full bg-item-dark border border-border-dark flex items-center justify-center text-text-secondary-dark hover:text-text-primary-dark transition"
          title="Сменить тему"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};
