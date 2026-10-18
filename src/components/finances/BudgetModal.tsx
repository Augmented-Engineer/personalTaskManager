import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLimit: number;
  onSave: (limit: number) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  currentLimit,
  onSave,
}) => {
  const [budgetInput, setBudgetInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBudgetInput(currentLimit ? currentLimit.toString() : '');
    }
  }, [isOpen, currentLimit]);

  const handleSubmit = () => {
    const limit = parseFloat(budgetInput.replace(',', '.'));
    if (!isNaN(limit) && limit >= 0) {
      onSave(limit);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} onEnter={handleSubmit}>
      {isOpen && (
        <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 w-full max-w-sm flex flex-col gap-6 shadow-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-[20px] font-bold text-text-primary-dark tracking-tight">Дневной лимит</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-text-secondary-dark uppercase tracking-wider">
              Сумма (₽)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value.replace(/[^0-9.,]/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder="0"
              className="w-full bg-item-dark border border-border-dark rounded-xl px-4 py-3.5 text-[15px] text-text-primary-dark outline-none focus:border-accent transition-colors"
              autoFocus
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!budgetInput}
            className="w-full bg-text-primary-dark disabled:opacity-40 text-bg-dark font-bold text-[15px] py-4 rounded-xl shadow-md transition-transform active:scale-[0.98]"
          >
            Сохранить (Enter)
          </button>
        </div>
      )}
    </Modal>
  );
};
