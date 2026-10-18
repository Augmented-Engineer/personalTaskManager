import React, { useState } from 'react';
import { CalendarDays, CalendarCheck, FileText, Wallet, PlusCircle, Handshake, PieChart, Upload, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export type ScreenType = 'today' | 'tasks' | 'notes' | 'finances' | 'operations' | 'debts' | 'analytics';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
  onExport: () => void;
  onImport: () => void;
}

const MENU_ITEMS = [
  { id: 'today', title: 'Сегодня', icon: CalendarDays },
  { id: 'tasks', title: 'План задач', icon: CalendarCheck },
  { id: 'notes', title: 'Заметки', icon: FileText },
  { id: 'finances', title: 'Финансы', icon: Wallet },
  { id: 'operations', title: 'Операции', icon: PlusCircle },
  { id: 'debts', title: 'Долги', icon: Handshake },
  { id: 'analytics', title: 'Анализ', icon: PieChart },
] as const;

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
                                                              isOpen, onClose, currentScreen, onSelectScreen, onExport, onImport,
                                                            }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeIndex = MENU_ITEMS.findIndex(item => item.id === currentScreen);

  return (
      <>
        <div
            className={`md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out ${
                isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={onClose}
        />

        <aside
            className={`fixed md:static inset-y-0 left-0 z-50 shrink-0 bg-card-dark border-r border-border-dark h-full flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0'
            } ${
                isCollapsed ? 'w-[280px] p-5 md:w-[84px] md:px-3 md:py-5' : 'w-[280px] p-5'
            }`}
        >
          <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex absolute -right-3 top-10 w-6 h-6 bg-item-dark border border-border-dark rounded-full items-center justify-center text-text-secondary-dark hover:text-text-primary-dark hover:border-text-secondary-dark transition-transform hover:scale-110 z-50 shadow-sm"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div className="flex flex-col gap-6 overflow-hidden w-full">
            {/* Шапка меню */}
            <div className="flex items-center w-full h-12">
              <div className={`flex items-center w-full transition-all duration-300 ${isCollapsed ? 'md:justify-center' : 'gap-3 px-1'}`}>
                <div className="w-11 h-11 rounded-full overflow-hidden bg-item-dark border border-border-dark flex items-center justify-center text-xl shrink-0">
                  🦊
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col whitespace-nowrap overflow-hidden">
                      <span className="text-[18px] font-black text-text-primary-dark tracking-tight">Планировщик</span>
                    </div>
                )}
              </div>
            </div>

            {/* Навигация */}
            <nav className="relative flex flex-col gap-2 mt-2 w-full">
              {/* Плавающий активный бегунок */}
              <div
                  className={`absolute border border-accent bg-item-dark/50 shadow-sm rounded-card transition-all duration-300 ease-out z-0 ${
                      isCollapsed
                          ? 'md:left-1/2 md:-translate-x-1/2 md:w-12 h-[46px]'
                          : 'left-0 right-0 h-[46px]'
                  }`}
                  style={{
                    transform: isCollapsed
                        ? `translate(-50%, calc(${activeIndex} * (46px + 0.5rem)))`
                        : `translateY(calc(${activeIndex} * (46px + 0.5rem)))`
                  }}
              />

              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const isSelected = currentScreen === item.id;

                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectScreen(item.id);
                          onClose();
                        }}
                        title={isCollapsed ? item.title : undefined}
                        className={`relative z-10 flex items-center h-[46px] rounded-card text-sm font-semibold transition-colors duration-200 ${
                            isCollapsed
                                ? 'md:w-12 md:mx-auto md:justify-center md:px-0 w-full px-3.5 gap-3.5'
                                : 'w-full px-3.5 gap-3.5'
                        } ${
                            isSelected ? 'text-text-primary-dark' : 'text-text-secondary-dark hover:text-text-primary-dark'
                        }`}
                    >
                      <Icon size={20} className={`shrink-0 transition-colors duration-200 ${isSelected ? 'text-accent' : 'text-text-secondary-dark'}`} />
                      {!isCollapsed && (
                          <span className="whitespace-nowrap truncate">
                      {item.title}
                    </span>
                      )}
                    </button>
                );
              })}
            </nav>
          </div>

          {/* Экспорт / Импорт */}
          <div className={`flex pt-4 border-t border-border-dark transition-all duration-300 w-full ${isCollapsed ? 'md:flex-col md:gap-3 md:items-center' : 'items-center gap-2'}`}>
            <button
                onClick={onExport}
                title={isCollapsed ? "Экспорт" : undefined}
                className={`py-2.5 bg-item-dark border border-border-dark flex items-center justify-center text-xs font-semibold text-text-primary-dark hover:border-text-secondary-dark transition-all duration-200 ${
                    isCollapsed
                        ? 'md:w-11 md:h-11 md:p-0 md:rounded-full w-full rounded-pill px-2 gap-1.5'
                        : 'flex-1 px-2 rounded-pill gap-1.5'
                }`}
            >
              <Upload size={15} className="text-accent-red shrink-0" />
              {!isCollapsed && <span>Экспорт</span>}
            </button>
            <button
                onClick={onImport}
                title={isCollapsed ? "Импорт" : undefined}
                className={`py-2.5 bg-item-dark border border-border-dark flex items-center justify-center text-xs font-semibold text-text-primary-dark hover:border-text-secondary-dark transition-all duration-200 ${
                    isCollapsed
                        ? 'md:w-11 md:h-11 md:p-0 md:rounded-full w-full rounded-pill px-2 gap-1.5'
                        : 'flex-1 px-2 rounded-pill gap-1.5'
                }`}
            >
              <Download size={15} className="text-accent-red shrink-0" />
              {!isCollapsed && <span>Импорт</span>}
            </button>
          </div>
        </aside>
      </>
  );
};