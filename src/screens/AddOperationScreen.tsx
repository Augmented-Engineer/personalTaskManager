import React, { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Coffee, CreditCard, Check, AlignLeft, Edit2, Trash2, X, Plus } from "lucide-react";
import { db, insertTransactionWithBalance } from "../db/db";
import { getTodayEpochDay, dateStrToEpochDay } from "../utils/dateUtils";
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Modal } from '../components/ui/Modal';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';

export const AddOperationScreen: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [isExpense, setIsExpense] = useState(true);
  const [isDaily, setIsDaily] = useState(true);
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState("");

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  });

  const amountInputRef = useRef<HTMLInputElement>(null);

  const rawAccounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const rawCategories = useLiveQuery(async () => {
    const all = await db.categories.toArray();
    return all.filter(c => c.isExpense === isExpense);
  }, [isExpense]) || [];

  const accounts = Array.from(new Map(rawAccounts.map(item => [item.name, item])).values());
  const categories = Array.from(new Map(rawCategories.map(item => [item.name, item])).values());

  useEffect(() => {
    if (accounts.length > 0 && selectedAccountId === null) {
      setSelectedAccountId(accounts[0].id!);
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (categories.length > 0) {
      if (!selectedCategory || !categories.find(c => c.name === selectedCategory)) {
        setSelectedCategory(categories[0].name);
      }
    }
  }, [categories, isExpense, selectedCategory]);

  useEffect(() => {
    amountInputRef.current?.focus();
  }, []);

  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!selectedAccountId || !selectedCategory) return;

    const parts = selectedDateStr.split("-");
    let targetEpoch = getTodayEpochDay();
    if (parts.length === 3) {
      targetEpoch = dateStrToEpochDay(selectedDateStr);
    }

    await insertTransactionWithBalance({
      title: comment.trim() || selectedCategory,
      amount: numAmount,
      category: selectedCategory,
      accountId: selectedAccountId,
      dateEpochDay: targetEpoch,
      isExpense,
      isDaily
    });

    setAmount("");
    setComment("");
    onSuccess();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.,]/g, "");
    if (val.match(/^[0-9]*[.,]?[0-9]{0,2}$/)) {
      setAmount(val);
    }
  };

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    const exists = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert("Такая категория уже существует");
      return;
    }
    await db.categories.add({ name, isExpense });
    setNewCatName("");
  };

  const handleDeleteCategory = async (id: number) => {
    await db.categories.delete(id);
    if (selectedCategory && categories.find(c => c.id === id)?.name === selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const handleSaveEditCategory = async (id: number, oldName: string) => {
    const name = editingCatName.trim();
    if (!name) return;
    await db.transaction('rw', db.categories, db.transactions, async () => {
      await db.categories.update(id, { name });
      await db.transactions.where('category').equals(oldName).modify({ category: name });
    });
    setEditingCatId(null);
    setEditingCatName("");
    if (selectedCategory === oldName) setSelectedCategory(name);
  };

  const activeColor = isExpense ? "text-[#ef4444]" : "text-accent";

  return (
    <div className="flex flex-col gap-8 pb-32 w-full text-left">
      
      <div className="relative flex bg-item-dark p-1 rounded-xl border border-border-dark w-full max-w-sm mx-auto z-0 item-reveal delay-100">
        <div 
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-card-dark border border-border-dark rounded-lg shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] -z-10"
          style={{ transform: isExpense ? "translateX(0)" : "translateX(100%)" }}
        />
        <button onClick={() => setIsExpense(true)} className={`relative z-10 flex-1 py-2 text-[14px] font-semibold transition-colors duration-300 ${isExpense ? "text-text-primary-dark" : "text-text-secondary-dark hover:text-text-primary-dark"}`}>Расход</button>
        <button onClick={() => setIsExpense(false)} className={`relative z-10 flex-1 py-2 text-[14px] font-semibold transition-colors duration-300 ${!isExpense ? "text-text-primary-dark" : "text-text-secondary-dark hover:text-text-primary-dark"}`}>Доход</button>
      </div>

      <div className="flex flex-col items-center justify-center py-4 group item-reveal delay-200">
        <div className="relative flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within:-translate-y-1">
          <input
            ref={amountInputRef}
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            placeholder="0"
            className={`w-full max-w-[300px] bg-transparent text-center text-[56px] leading-none font-extrabold tracking-tight outline-none placeholder:text-border-dark transition-colors duration-300 ${amount ? activeColor : "text-text-primary-dark"}`}
          />
        </div>
        <span className="text-[13px] font-medium text-text-secondary-dark mt-3 transition-opacity duration-300 group-focus-within:opacity-70">
          Сумма операции (₽)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full items-start">
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className={`flex flex-col gap-8 item-reveal delay-300 relative transition-all duration-300 ${isDatePickerOpen ? 'z-50' : 'z-10'}`}>
          
          <div className="flex flex-col gap-4">
            <span className="text-[14px] font-bold text-text-primary-dark px-1 tracking-tight">Счет списания</span>
            <div className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-1">
              {accounts.map(acc => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id!)}
                    className={`flex-shrink-0 px-5 py-4 rounded-[16px] border text-left transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isSelected ? "bg-item-dark border-text-primary-dark shadow-sm scale-[0.98]" : "bg-card-dark border-border-dark text-text-primary-dark hover:bg-item-dark/40 hover:border-white/20 hover:-translate-y-1 hover:shadow-lg"
                    }`}
                  >
                    <div className="text-[14px] font-semibold">{acc.name}</div>
                    <div className={`text-[12px] font-mono mt-1 transition-colors duration-300 ${isSelected ? "text-text-primary-dark" : "text-text-secondary-dark"}`}>
                      <AnimatedNumber value={acc.balance} /> ₽
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-[14px] font-bold text-text-primary-dark px-1 tracking-tight">Детали</span>
            <div className="bg-card-dark border border-border-dark rounded-[20px] flex flex-col shadow-sm transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-white/20 hover:shadow-lg">
              
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border-dark bg-transparent hover:bg-item-dark/30 transition-colors duration-300 rounded-t-[20px] relative z-30">
                <CustomDatePicker value={selectedDateStr} onChange={setSelectedDateStr} isOpen={isDatePickerOpen} setIsOpen={setIsDatePickerOpen} />
              </div>

              <div className={`flex items-center gap-3 px-5 py-4 bg-transparent hover:bg-item-dark/30 focus-within:bg-item-dark transition-colors duration-300 ${!isExpense ? 'rounded-b-[20px]' : 'border-b border-border-dark'}`}>
                <AlignLeft size={18} className="text-text-secondary-dark transition-colors duration-300" />
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                  placeholder="Комментарий (необязательно)"
                  className="flex-1 bg-transparent text-[15px] font-medium text-text-primary-dark outline-none placeholder:text-text-secondary-dark/50"
                />
              </div>

              {isExpense && (
                <div className="flex bg-transparent rounded-b-[20px]">
                  <button onClick={() => setIsDaily(true)} className={`flex-1 py-4 flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors duration-300 border-r border-border-dark rounded-bl-[20px] ${isDaily ? "text-text-primary-dark bg-item-dark" : "text-text-secondary-dark hover:bg-item-dark/50 hover:text-text-primary-dark"}`}>
                    <Coffee size={16} className={`transition-colors duration-300 ${isDaily ? "text-[#ef4444]" : ""}`} /> Ежедневная
                  </button>
                  <button onClick={() => setIsDaily(false)} className={`flex-1 py-4 flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors duration-300 rounded-br-[20px] ${!isDaily ? "text-text-primary-dark bg-item-dark" : "text-text-secondary-dark hover:bg-item-dark/50 hover:text-text-primary-dark"}`}>
                    <CreditCard size={16} className={`transition-colors duration-300 ${!isDaily ? "text-[#E5A93C]" : ""}`} /> Обычная
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className="flex flex-col gap-4 relative z-10">
          <div className="flex justify-between items-center px-1">
            <span className="text-[14px] font-bold text-text-primary-dark tracking-tight">Категория</span>
            <button onClick={() => setIsCategoryModalOpen(true)} className="p-1 rounded-md text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors"><Edit2 size={14} /></button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 px-1 -mx-1 item-reveal delay-400">
            {categories.map(cat => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-4 rounded-[16px] border text-left transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col justify-between min-h-[80px] ${
                    isSelected ? "bg-item-dark border-text-primary-dark shadow-sm scale-[0.98]" : "bg-card-dark border-border-dark hover:bg-item-dark/40 hover:border-white/20 hover:-translate-y-1 hover:shadow-lg"
                  }`}
                >
                  <span className={`text-[14px] font-semibold transition-colors duration-300 ${isSelected ? "text-text-primary-dark" : "text-text-secondary-dark"}`}>{cat.name}</span>
                  {isSelected && <Check size={16} strokeWidth={3} className="mt-2 text-text-primary-dark animate-in zoom-in duration-200" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="sticky bottom-6 mt-4 flex justify-center z-30 item-reveal delay-500">
        <div className="w-full">
           <button
              onClick={handleSave}
              disabled={!amount || parseFloat(amount.replace(",", ".")) <= 0}
              className={`w-full h-14 font-bold text-[16px] rounded-[16px] flex items-center justify-center border transition-all duration-300 ${
                !amount || parseFloat(amount.replace(",", ".")) <= 0
                  ? "bg-item-dark border-border-dark text-text-secondary-dark shadow-none"
                  : "bg-text-primary-dark border-transparent text-bg-dark shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
              }`}
            >
              {isExpense ? "Записать расход (Enter)" : "Записать доход (Enter)"}
            </button>
        </div>
      </div>
      
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)}>
        {isCategoryModalOpen && (
          <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 w-full max-w-sm flex flex-col gap-6 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center sticky top-0 bg-card-dark z-10 pb-2">
              <h3 className="text-[20px] font-bold text-text-primary-dark tracking-tight">Категории</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors"><X size={18} /></button>
            </div>

            <div className="flex flex-col gap-3">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 bg-item-dark px-4 py-3 rounded-[16px] border border-border-dark group transition-colors hover:border-white/10">
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2 w-full animate-in fade-in duration-200">
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditCategory(cat.id!, cat.name); }}
                        className="flex-1 bg-transparent text-[14px] font-medium text-text-primary-dark outline-none"
                        autoFocus
                      />
                      <button onClick={() => handleSaveEditCategory(cat.id!, cat.name)} className="p-1 text-accent hover:opacity-80 transition-opacity"><Check size={16} strokeWidth={3} /></button>
                      <button onClick={() => setEditingCatId(null)} className="p-1 text-text-secondary-dark hover:text-[#ef4444] transition-colors"><X size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[14px] font-medium text-text-primary-dark flex-1 truncate">{cat.name}</span>
                      <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingCatId(cat.id!); setEditingCatName(cat.name); }} className="p-1.5 rounded-md hover:bg-card-dark text-text-secondary-dark hover:text-text-primary-dark transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteCategory(cat.id!)} className="p-1.5 rounded-md hover:bg-card-dark text-text-secondary-dark hover:text-[#ef4444] transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 sticky bottom-0 bg-card-dark pt-2">
              <input 
                type="text" 
                value={newCatName} 
                onChange={(e) => setNewCatName(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); }}
                placeholder="Новая категория..." 
                className="flex-1 bg-item-dark border border-border-dark rounded-[14px] px-4 py-3.5 text-[14px] text-text-primary-dark outline-none focus:border-accent transition-colors" 
              />
              <button onClick={handleAddCategory} disabled={!newCatName.trim()} className="w-12 h-auto bg-item-dark border border-border-dark hover:border-text-primary-dark rounded-[14px] flex items-center justify-center text-text-secondary-dark hover:text-text-primary-dark disabled:opacity-50 transition-colors">
                <Plus size={18} />
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
