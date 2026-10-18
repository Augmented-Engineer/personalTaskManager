import type { Note } from '../types';
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, X, FileText } from 'lucide-react';
import { db } from '../db/db';
import { Modal } from '../components/ui/Modal';



export const NotesScreen: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

    const rawNotes = useLiveQuery(() => db.notes.toArray()) || [];
    const notes = rawNotes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    const openNew = () => {
        setEditingNoteId(null);
        setTitle('');
        setContent('');
        setIsModalOpen(true);
    };

    const openEdit = (note: Note) => {
        setEditingNoteId(note.id!);
        setTitle(note.title);
        setContent(note.content);
        setIsModalOpen(true);
    };

    const handleSaveAndClose = async () => {
        const t = title.trim();
        const c = content.trim();

        if (!t && !c) {
            if (editingNoteId) await db.notes.delete(editingNoteId);
            setIsModalOpen(false);
            return;
        }

        const now = Date.now();
        if (editingNoteId) {
            await db.notes.update(editingNoteId, { title: t, content: c, updatedAt: now });
        } else {
            await db.notes.add({ title: t, content: c, updatedAt: now });
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (id: number) => {
        await db.notes.delete(id);
        setNoteToDelete(null);
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('ru-RU', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col gap-6 w-full pb-24 lg:pb-8">

            <div className="flex justify-between items-end px-1 border-b border-border-dark pb-4 item-reveal delay-100">
                <h2 className="text-xl font-bold text-text-primary-dark tracking-tight">Заметки</h2>
                <span className="text-[12px] font-mono text-text-secondary-dark px-2 py-1 rounded bg-item-dark border border-border-dark">
          {notes.length} шт
        </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                <button
                    onClick={openNew}
                    className="hidden sm:flex bg-transparent border-2 border-border-dark border-dashed rounded-[20px] p-6 flex-col items-center justify-center gap-4 transition-all duration-300 hover:border-text-primary-dark hover:bg-item-dark/30 min-h-[220px] item-reveal delay-100"
                >
                    <div className="w-12 h-12 rounded-full bg-card-dark flex items-center justify-center text-text-secondary-dark shadow-sm">
                        <Plus size={24} />
                    </div>
                    <span className="text-[14px] font-semibold text-text-secondary-dark">Новая заметка</span>
                </button>

                {notes.length === 0 && (
                    <div className="sm:hidden flex flex-col items-center justify-center py-16 text-text-secondary-dark text-[14px] bg-card-dark border border-border-dark rounded-[20px] border-dashed item-reveal delay-200">
                        У вас пока нет заметок.
                    </div>
                )}

                {notes.map((note, idx) => (
                    <div
                        key={note.id}
                        onClick={() => openEdit(note)}
                        className="bg-card-dark border border-border-dark rounded-[20px] p-6 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 shadow-sm hover:shadow-lg cursor-pointer min-h-[220px] group item-reveal"
                        style={{ animationDelay: `${(idx % 8) * 50 + 150}ms` }}
                    >
                        <h3 className="text-[17px] font-bold text-text-primary-dark line-clamp-2">
                            {note.title || 'Без названия'}
                        </h3>
                        <p className="text-[14px] text-text-secondary-dark line-clamp-4 flex-1 whitespace-pre-wrap leading-relaxed">
                            {note.content || '...'}
                        </p>

                        <div className="mt-4 pt-4 border-t border-border-dark flex justify-between items-center text-[11px] font-mono text-text-secondary-dark">
                            <span>{formatDate(note.updatedAt)}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id!); }}
                                className="p-1.5 rounded-md hover:bg-item-dark text-text-secondary-dark hover:text-[#ef4444] transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="sm:hidden fixed bottom-6 mt-4 flex justify-center z-30 pointer-events-none left-0 right-0 item-reveal delay-300">
                <div className="w-full px-4 pointer-events-auto flex justify-end max-w-md mx-auto">
                    <button
                        onClick={openNew}
                        className="w-14 h-14 bg-text-primary-dark text-bg-dark rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-95 border border-border-dark"
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleSaveAndClose}>
                {isModalOpen && (
                    <div className="bg-card-dark border border-border-dark rounded-[24px] p-0 w-full max-w-3xl flex flex-col shadow-2xl h-[85vh] sm:h-[75vh] overflow-hidden">

                        <div className="flex justify-between items-center px-6 py-4 border-b border-border-dark shrink-0">
              <span className="text-[12px] font-bold text-text-secondary-dark uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} /> Заметка
              </span>
                            <button onClick={handleSaveAndClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar gap-4">
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveAndClose(); }} // <-- ENTER ДЛЯ СОХРАНЕНИЯ
                                placeholder="Заголовок"
                                className="w-full bg-transparent text-[24px] font-black text-text-primary-dark outline-none placeholder:text-text-secondary-dark/50"
                            />
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                onKeyDown={(e) => {
                                    // <-- CMD+ENTER / CTRL+ENTER ДЛЯ СОХРАНЕНИЯ
                                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSaveAndClose();
                                    }
                                }}
                                placeholder="Начните писать..."
                                className="w-full flex-1 bg-transparent text-[15px] font-medium text-text-secondary-dark leading-relaxed outline-none resize-none placeholder:text-text-secondary-dark/50"
                                autoFocus
                            />
                        </div>

                        <div className="p-4 sm:p-6 border-t border-border-dark shrink-0">
                            <button
                                onClick={handleSaveAndClose}
                                className="w-full bg-text-primary-dark text-bg-dark font-bold text-[15px] py-4 rounded-[16px] shadow-md hover:shadow-lg transition-transform active:scale-[0.98]"
                            >
                                Сохранить (Cmd + Enter)
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!noteToDelete} onClose={() => setNoteToDelete(null)} onEnter={() => noteToDelete && handleDelete(noteToDelete)}>
                {noteToDelete && (
                    <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 w-full max-w-sm flex flex-col gap-5 shadow-2xl">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-[18px] font-bold text-text-primary-dark">Удалить заметку?</h3>
                            <p className="text-[14px] text-text-secondary-dark leading-relaxed">Восстановить её будет невозможно.</p>
                        </div>
                        <div className="flex justify-end gap-3 mt-2">
                            <button onClick={() => setNoteToDelete(null)} className="px-4 py-2 text-[14px] font-medium rounded-lg text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors">Отмена</button>
                            <button onClick={() => handleDelete(noteToDelete)} className="px-5 py-2 text-[14px] font-bold rounded-lg bg-[#ef4444] text-white hover:opacity-90 transition-opacity">Удалить (Enter)</button>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
};