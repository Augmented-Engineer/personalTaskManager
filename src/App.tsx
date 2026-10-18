import React, { useState, useEffect, useRef } from 'react';
import { AppContainer } from './components/layout/AppContainer';
import { TopHeader } from './components/layout/TopHeader';
import { SidebarDrawer, type ScreenType } from './components/layout/SidebarDrawer';
import { HomeScreen } from './screens/HomeScreen';
import { TodayScreen } from './screens/TodayScreen';
import { FinancesScreen } from './screens/FinancesScreen';
import { AddOperationScreen } from './screens/AddOperationScreen';
import { NotesScreen } from './screens/NotesScreen';
import { DebtsScreen } from './screens/DebtsScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { initDatabaseSeeds, db } from './db/db';
import { useTheme } from './hooks/useTheme';
import { ColorPickerModal } from './components/ui/ColorPickerModal';

export const App: React.FC = () => {
  const getInitialScreen = (): ScreenType => {
    const hash = window.location.hash.replace('#', '') as ScreenType;
    const validScreens: ScreenType[] = ['today', 'tasks', 'notes', 'finances', 'operations', 'debts', 'analytics'];
    return validScreens.includes(hash) ? hash : 'today';
  };

  const [currentScreen, setCurrentScreenState] = useState<ScreenType>(getInitialScreen);

  const setCurrentScreen = (screen: ScreenType) => {
    window.location.hash = screen;
    setCurrentScreenState(screen);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ScreenType;
      const validScreens: ScreenType[] = ['today', 'tasks', 'notes', 'finances', 'operations', 'debts', 'analytics'];
      if (validScreens.includes(hash)) {
        setCurrentScreenState(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [accentColor, setAccentColor] = useState<string>('#3b82f6');

  const { isDark, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initDatabaseSeeds();
    const savedColor = localStorage.getItem('accentColor');
    if (savedColor) {
      applyColor(savedColor);
    } else {
      applyColor('#3b82f6');
    }
  }, []);

  const applyColor = (colorValue: string) => {
    setAccentColor(colorValue);
    localStorage.setItem('accentColor', colorValue);

    if (colorValue === 'theme-adaptive') {
      document.documentElement.style.setProperty('--accent-color', 'var(--text-primary)');
      document.documentElement.style.setProperty('--accent-light-color', 'color-mix(in srgb, var(--text-primary) 15%, transparent)');
    } else {
      document.documentElement.style.setProperty('--accent-color', colorValue);
      document.documentElement.style.setProperty('--accent-light-color', colorValue + '26');
    }
  };

  const handleExport = async () => {
    try {
      const data = {
        settings: await db.settings.toArray(),
        tasks: await db.tasks.toArray(),
        subtasks: await db.subtasks.toArray(),
        transactions: await db.transactions.toArray(),
        accounts: await db.accounts.toArray(),
        categories: await db.categories.toArray(),
        notes: await db.notes.toArray(),
        debts: await db.debts.toArray(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const d = new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      a.download = `planner_backup_${dateStr}.json`;

      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Произошла ошибка при экспорте данных.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);

        // Передаем таблицы массивом, чтобы не превышать лимит аргументов сигнатуры Dexie
        const tables = [
          db.settings,
          db.tasks,
          db.subtasks,
          db.transactions,
          db.accounts,
          db.categories,
          db.notes,
          db.debts,
        ];

        await db.transaction('rw', tables, async () => {
          if (data.settings) { await db.settings.clear(); await db.settings.bulkAdd(data.settings); }
          if (data.tasks) { await db.tasks.clear(); await db.tasks.bulkAdd(data.tasks); }
          if (data.subtasks) { await db.subtasks.clear(); await db.subtasks.bulkAdd(data.subtasks); }
          if (data.transactions) { await db.transactions.clear(); await db.transactions.bulkAdd(data.transactions); }
          if (data.accounts) { await db.accounts.clear(); await db.accounts.bulkAdd(data.accounts); }
          if (data.categories) { await db.categories.clear(); await db.categories.bulkAdd(data.categories); }
          if (data.notes) { await db.notes.clear(); await db.notes.bulkAdd(data.notes); }
          if (data.debts) { await db.debts.clear(); await db.debts.bulkAdd(data.debts); }
        });

        alert('Данные успешно импортированы! Приложение будет перезагружено.');
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('Ошибка импорта! Убедитесь, что вы выбрали правильный файл резервной копии (.json).');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'today': return 'Сегодня';
      case 'tasks': return 'Планирование';
      case 'notes': return 'Заметки';
      case 'finances': return 'Финансы';
      case 'operations': return 'Запись операции';
      case 'debts': return 'Долги';
      case 'analytics': return 'Анализ';
    }
  };

  return (
      <AppContainer>
        <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
        />

        <SidebarDrawer
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            currentScreen={currentScreen}
            onSelectScreen={setCurrentScreen}
            onExport={handleExport}
            onImport={handleImportClick}
        />

        <main className="flex-1 h-screen overflow-y-auto custom-scrollbar relative w-full bg-bg-dark">
          <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 transition-all duration-300">
            <TopHeader
                title={getScreenTitle()}
                onOpenMenu={() => setIsMenuOpen(true)}
                isDark={isDark}
                onToggleTheme={toggleTheme}
                onOpenColors={() => setIsColorPickerOpen(true)}
            />

            {currentScreen === 'today' && <HomeScreen onNavigateToTasks={() => setCurrentScreen('tasks')} />}
            {currentScreen === 'tasks' && <TodayScreen />}
            {currentScreen === 'finances' && <FinancesScreen />}
            {currentScreen === 'operations' && <AddOperationScreen onSuccess={() => setCurrentScreen('today')} />}
            {currentScreen === 'notes' && <NotesScreen />}
            {currentScreen === 'debts' && <DebtsScreen />}
            {currentScreen === 'analytics' && <AnalyticsScreen />}
          </div>
        </main>

        <ColorPickerModal
            isOpen={isColorPickerOpen}
            onClose={() => setIsColorPickerOpen(false)}
            currentColor={accentColor}
            onSelectColor={applyColor}
        />
      </AppContainer>
  );
};

export default App;