import React from 'react';
import { Calendar, Wallet, PlusCircle, Handshake, PieChart } from 'lucide-react';

export type TabType = 'today' | 'finances' | 'add' | 'debts' | 'analytics';

interface TabItem {
  id: TabType;
  title: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  { id: 'today', title: 'План', icon: Calendar },
  { id: 'finances', title: 'Финансы', icon: Wallet },
  { id: 'add', title: 'Запись', icon: PlusCircle },
  { id: 'debts', title: 'Долги', icon: Handshake },
  { id: 'analytics', title: 'Анализ', icon: PieChart },
];

interface BottomBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center bg-bg-dark border-t border-border-dark select-none">
      <div className="w-full max-w-md flex items-center justify-around py-2 px-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-150 relative"
            >
              <div
                className={`p-1.5 rounded-full transition-all duration-200 ${
                  isSelected ? 'bg-card-dark text-accent' : 'text-text-secondary-dark hover:text-text-primary-dark'
                }`}
              >
                <Icon size={22} strokeWidth={isSelected ? 2.5 : 2} />
              </div>
              <span
                className={`text-[11px] font-medium mt-0.5 tracking-tight ${
                  isSelected ? 'text-accent font-semibold' : 'text-text-secondary-dark'
                }`}
              >
                {tab.title}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
