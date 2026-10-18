import React from 'react';

export const AppContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen w-full bg-bg-dark text-text-primary-dark font-sans overflow-hidden">
      {children}
    </div>
  );
};
