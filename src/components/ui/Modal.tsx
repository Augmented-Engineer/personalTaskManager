import React, { useState, useEffect } from 'react';
import { useMountTransition } from '../../hooks/useMountTransition';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEnter?: () => void; // <-- ДОБАВЛЕН НОВЫЙ ПРОПС
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onEnter, children }) => {
    const hasTransitionedIn = useMountTransition(isOpen, 300);
    const [cachedChildren, setCachedChildren] = useState<React.ReactNode>(children);

    useEffect(() => {
        if (isOpen) setCachedChildren(children);
    }, [isOpen, children]);

    // Глобальный слушатель клавиатуры для ESCAPE и ENTER
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }

            // Если передан onEnter, выполняем его по нажатию Enter
            if (e.key === 'Enter' && onEnter) {
                e.preventDefault();
                onEnter();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onEnter]);

    if (!hasTransitionedIn && !isOpen) return null;
    const isAppearing = isOpen && hasTransitionedIn;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-auto ${isAppearing ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <div
                className={`relative z-10 w-full flex justify-center pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isAppearing ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.95] translate-y-4'}`}
            >
                {isOpen ? children : cachedChildren}
            </div>
        </div>
    );
};