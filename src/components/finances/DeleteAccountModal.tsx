import React from 'react';
import { Modal } from '../ui/Modal';
import type { Account } from '../../types';

interface DeleteAccountModalProps {
  account: Account | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  account,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal isOpen={!!account} onClose={onClose} onEnter={onConfirm}>
      {account && (
        <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 w-full max-w-sm flex flex-col gap-5 shadow-2xl">
          <div className="flex flex-col gap-2">
            <h3 className="text-[18px] font-bold text-text-primary-dark">Удалить счет?</h3>
            <p className="text-[14px] text-text-secondary-dark leading-relaxed">
              Счет <span className="text-text-primary-dark font-medium">«{account.name}»</span> будет удален. Сохраненные операции останутся в истории, но потеряют привязку к этому счету.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[14px] font-medium rounded-lg text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2 text-[14px] font-bold rounded-lg bg-[#ef4444] text-white hover:opacity-90 transition-opacity"
            >
              Удалить (Enter)
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
