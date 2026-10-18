import type { Debt } from '../types';
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Check, Edit2, Trash2, X, User, AlignLeft, Calendar as CalendarIcon } from 'lucide-react';
import { db } from '../db/db';
import { epochDayToDate, formatHeaderDate, dateStrToEpochDay } from '../utils/dateUtils';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Modal } from '../components/ui/Modal';



type FilterType = 'all' | 'owe_me' | 'i_owe';
const FILTERS: FilterType[] = ['all', 'owe_me', 'i_owe'];

export const DebtsScreen: React.FC = () => {
    const [filter, setFilter] = useState<FilterType>('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [type, setType] = useState<'owe_me' | 'i_owe'>('owe_me');
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [dateStr, setDateStr] = useState<string>(() => {
        const d = new Date();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${month}-${day}`;
    });

    const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);
    const [debtToRepay, setDebtToRepay] = useState<Debt | null>(null);

    const rawDebts = useLiveQuery(() => db.debts.toArray()) || [];
    const debts = rawDebts.sort((a, b) => (b.id || 0) - (a.id || 0));

    const oweMeTotal = debts.filter(d => d.type === 'owe_me').reduce((sum, d) => sum + d.amount, 0);
    const iOweTotal = debts.filter(d => d.type === 'i_owe').reduce((sum, d) => sum + d.amount, 0);

    const filteredDebts = debts.filter(d => filter === 'all' || d.type === filter);
    const activeFilterIndex = FILTERS.indexOf(filter);

    const openNew = (defaultType: 'owe_me' | 'i_owe') => {
        setEditingId(null);
        setType(defaultType);
        setName('');
        setAmount('');
        setDescription('');
        setIsModalOpen(true);
    };

    const openEdit = (debt: Debt) => {
        setEditingId(debt.id!);
        setType(debt.type);
        setName(debt.name);
        setAmount(debt.amount.toString());
        setDescription(debt.description);

        const d = epochDayToDate(debt.dateEpochDay);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setDateStr(`${d.getFullYear()}-${month}-${day}`);

        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const numAmount = parseFloat(amount.replace(',', '.'));
        if (!name.trim() || isNaN(numAmount) || numAmount <= 0) return;

        const parts = dateStr.split('-');
        let targetEpoch = dateStrToEpochDay(dateStr);
        if (parts.length === 3) {
            targetEpoch = dateStrToEpochDay(dateStr);
        }

        const payload = { type, name: name.trim(), amount: numAmount, dateEpochDay: targetEpoch, description: description.trim() };

        if (editingId) {
            await db.debts.update(editingId, payload);
        } else {
            await db.debts.add(payload);
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (id: number) => {
        await db.debts.delete(id);
        setDebtToDelete(null);
    };

    const handleRepay = async (id: number) => {
        await db.debts.delete(id);
        setDebtToRepay(null);
    };

    return (
        <div className="flex flex-col gap-8 pb-24 lg:pb-8 w-full text-left items-start animate-in fade-in duration-500">

            {/* Секция статистики: Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full item-reveal delay-100">

                {/* Карточка: Мне должны */}
                <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-white/20 shadow-lg group">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-[2.8rem] leading-none font-extrabold tracking-tight text-text-primary-dark">
                                <AnimatedNumber value={oweMeTotal} /><span className="text-2xl text-text-secondary-dark ml-2">₽</span>
                            </div>
                            <div className="text-[0.92rem] text-text-secondary-dark mt-2 font-medium">Мне должны</div>
                        </div>
                        <button
                            onClick={() => openNew('owe_me')}
                            className="w-10 h-10 rounded-[14px] bg-item-dark flex items-center justify-center text-text-primary-dark hover:bg-text-primary-dark hover:text-bg-dark transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {/* Карточка: Я должен */}
                <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-white/20 shadow-lg group">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-[2.8rem] leading-none font-extrabold tracking-tight text-text-primary-dark">
                                <AnimatedNumber value={iOweTotal} /><span className="text-2xl text-text-secondary-dark ml-2">₽</span>
                            </div>
                            <div className="text-[0.92rem] text-text-secondary-dark mt-2 font-medium">Я должен</div>
                        </div>
                        <button
                            onClick={() => openNew('i_owe')}
                            className="w-10 h-10 rounded-[14px] bg-item-dark flex items-center justify-center text-text-primary-dark hover:bg-text-primary-dark hover:text-bg-dark transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

            </div>

            <div className="flex flex-col gap-4 w-full item-reveal delay-200">

                {/* Плавающий переключатель (Строгий стиль) */}
                <div className="relative flex bg-item-dark p-1 rounded-xl border border-border-dark w-full max-w-md z-0 mb-2">
                    <div
                        className="absolute top-1 bottom-1 left-1 bg-card-dark border border-border-dark rounded-lg shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] -z-10"
                        style={{ width: 'calc((100% - 8px) / 3)', transform: `translateX(calc(${activeFilterIndex} * 100%))` }}
                    />
                    {FILTERS.map((f) => {
                        const labels: Record<FilterType, string> = { all: 'Все', owe_me: 'Мне должны', i_owe: 'Я должен' };
                        const isSelected = filter === f;
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 py-1.5 text-[13px] font-semibold rounded-lg transition-colors duration-300 ${
                                    isSelected ? 'text-text-primary-dark' : 'text-text-secondary-dark hover:text-text-primary-dark'
                                }`}
                            >
                                {labels[f]}
                            </button>
                        );
                    })}
                </div>

                {filteredDebts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-text-secondary-dark text-[14px] bg-card-dark border border-border-dark rounded-[20px] border-dashed item-reveal delay-300">
                        Долгов нет. Отличная финансовая карма.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {filteredDebts.map((debt, idx) => {
                            const isOweMe = debt.type === 'owe_me';
                            return (
                                <div
                                    key={debt.id}
                                    className="bg-card-dark border border-border-dark rounded-[20px] p-5 lg:p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 shadow-sm hover:shadow-lg group item-reveal"
                                    style={{ animationDelay: `${(idx % 8) * 50 + 200}ms` }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="text-[18px] font-bold text-text-primary-dark tracking-tight">{debt.name}</span>
                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-item-dark border border-border-dark text-text-secondary-dark">
                          {isOweMe ? 'Мне должны' : 'Я должен'}
                        </span>
                                            </div>
                                            <span className="text-[12px] text-text-secondary-dark font-mono">{formatHeaderDate(debt.dateEpochDay)}</span>
                                        </div>
                                        <span className="text-[20px] lg:text-[24px] font-extrabold text-text-primary-dark tracking-tight whitespace-nowrap ml-2">
                      <AnimatedNumber value={debt.amount} /> ₽
                    </span>
                                    </div>

                                    {debt.description && (
                                        <p className="text-[14px] text-text-secondary-dark leading-relaxed line-clamp-2">
                                            {debt.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-border-dark">
                                        <button
                                            onClick={() => setDebtToRepay(debt)}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-item-dark text-text-primary-dark border border-border-dark font-semibold text-[13px] hover:bg-text-primary-dark hover:text-bg-dark transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                                        >
                                            <Check size={16} strokeWidth={2.5} /> Погасить
                                        </button>
                                        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(debt)} className="p-2 rounded-lg text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => setDebtToDelete(debt)} className="p-2 rounded-lg text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- МОДАЛКИ --- */}

            {/* Добавление / Редактирование долга */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {isModalOpen && (
                    <div className="bg-card-dark border border-border-dark rounded-[24px] p-6 lg:p-8 w-full max-w-md flex flex-col gap-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[20px] font-bold text-text-primary-dark tracking-tight">{editingId ? 'Редактирование' : 'Новый долг'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors"><X size={18} /></button>
                        </div>

                        <div className="relative flex bg-item-dark p-1 rounded-xl border border-border-dark w-full z-0">
                            <div
                                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-card-dark border border-border-dark rounded-lg shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] -z-10"
                                style={{ transform: type === 'owe_me' ? "translateX(0)" : "translateX(100%)" }}
                            />
                            <button onClick={() => setType('owe_me')} className={`relative z-10 flex-1 py-2 text-[14px] font-semibold transition-colors duration-300 ${type === 'owe_me' ? "text-text-primary-dark" : "text-text-secondary-dark hover:text-text-primary-dark"}`}>Мне должны</button>
                            <button onClick={() => setType('i_owe')} className={`relative z-10 flex-1 py-2 text-[14px] font-semibold transition-colors duration-300 ${type === 'i_owe' ? "text-text-primary-dark" : "text-text-secondary-dark hover:text-text-primary-dark"}`}>Я должен</button>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-text-secondary-dark uppercase tracking-wider">Кто / Кому</label>
                                <div className="flex items-center gap-3 px-4 py-3 border border-border-dark bg-item-dark rounded-xl focus-within:border-text-secondary-dark transition-colors">
                                    <User size={18} className="text-text-secondary-dark" />
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }} placeholder="Имя человека" className="w-full bg-transparent text-[15px] font-medium text-text-primary-dark outline-none" autoFocus />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-text-secondary-dark uppercase tracking-wider">Сумма (₽)</label>
                                <input type="text" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))} onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }} placeholder="0" className="w-full bg-item-dark border border-border-dark rounded-xl px-4 py-3.5 text-[15px] font-bold text-text-primary-dark outline-none focus:border-text-secondary-dark transition-colors" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-text-secondary-dark uppercase tracking-wider">Дата</label>
                                <div className="flex items-center gap-3 px-4 py-3 border border-border-dark bg-item-dark rounded-xl focus-within:border-text-secondary-dark transition-colors">
                                    <CalendarIcon size={18} className="text-text-secondary-dark" />
                                    <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }} className="w-full bg-transparent text-[15px] font-medium text-text-primary-dark outline-none" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-text-secondary-dark uppercase tracking-wider">За что (необязательно)</label>
                                <div className="flex items-start gap-3 px-4 py-3 border border-border-dark bg-item-dark rounded-xl focus-within:border-text-secondary-dark transition-colors">
                                    <AlignLeft size={18} className="text-text-secondary-dark mt-0.5" />
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Например: За билеты в кино" className="w-full bg-transparent text-[15px] font-medium text-text-primary-dark outline-none resize-none h-20 custom-scrollbar" />
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSave} disabled={!name.trim() || !amount} className="w-full bg-text-primary-dark disabled:opacity-40 text-bg-dark font-bold text-[15px] py-4 rounded-[16px] shadow-md transition-transform active:scale-[0.98]">
                            Сохранить (Enter)
                        </button>
                    </div>
                )}
            </Modal>

            {/* Подтверждение погашения */}
            <Modal isOpen={!!debtToRepay} onClose={() => setDebtToRepay(null)} onEnter={() => debtToRepay?.id && handleRepay(debtToRepay.id)}>
                {debtToRepay && (
                    <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 w-full max-w-sm flex flex-col gap-6 shadow-2xl">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-[20px] font-bold text-text-primary-dark tracking-tight">Погасить долг?</h3>
                            <p className="text-[14px] text-text-secondary-dark leading-relaxed">
                                Долг <span className="text-text-primary-dark font-bold">«{debtToRepay.name}»</span> на сумму <span className="text-text-primary-dark font-mono font-bold">{debtToRepay.amount} ₽</span> будет закрыт.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 mt-2">
                            <button onClick={() => setDebtToRepay(null)} className="px-5 py-2.5 text-[14px] font-medium rounded-lg text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors">Отмена</button>
                            <button onClick={() => handleRepay(debtToRepay.id!)} className="px-6 py-2.5 text-[14px] font-bold rounded-lg bg-text-primary-dark text-bg-dark hover:opacity-90 transition-opacity">Погасить (Enter)</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Подтверждение удаления */}
            <Modal isOpen={!!debtToDelete} onClose={() => setDebtToDelete(null)} onEnter={() => debtToDelete?.id && handleDelete(debtToDelete.id)}>
                {debtToDelete && (
                    <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 w-full max-w-sm flex flex-col gap-6 shadow-2xl">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-[20px] font-bold text-text-primary-dark tracking-tight">Удалить запись?</h3>
                            <p className="text-[14px] text-text-secondary-dark leading-relaxed">
                                Запись <span className="text-text-primary-dark font-bold">«{debtToDelete.name}»</span> будет удалена безвозвратно.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 mt-2">
                            <button onClick={() => setDebtToDelete(null)} className="px-5 py-2.5 text-[14px] font-medium rounded-lg text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors">Отмена</button>
                            <button onClick={() => handleDelete(debtToDelete.id!)} className="px-6 py-2.5 text-[14px] font-bold rounded-lg bg-text-primary-dark text-bg-dark hover:opacity-90 transition-opacity">Удалить (Enter)</button>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
};