import React, { useState } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import { db } from '../../db/db';
import type { Task, Subtask, PriorityType } from '../../types';
import { PRIORITIES } from '../../types';
import { CustomTimePicker } from '../ui/CustomTimePicker';

interface TaskEditModalProps {
    initialTask: Task | null;
    currentEpochDay: number;
    onClose: () => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ initialTask, currentEpochDay, onClose }) => {
    const [title, setTitle] = useState(initialTask?.title || '');
    const [timeText, setTimeText] = useState(initialTask?.timeText || '');
    const [priority, setPriority] = useState<PriorityType>(initialTask?.priority || 'MEDIUM');
    const [subtasks, setSubtasks] = useState<string[]>(initialTask?.subtasks?.map((s: Subtask) => s.title) || []);
    const [newSubtask, setNewSubtask] = useState('');

    const handleAddSubtask = () => {
        if (newSubtask.trim()) {
            setSubtasks([...subtasks, newSubtask.trim()]);
            setNewSubtask('');
        }
    };

    const handleSave = async () => {
        if (!title.trim()) return;
        await db.transaction('rw', db.tasks, db.subtasks, async () => {
            let taskId = initialTask?.id;
            if (!taskId) {
                taskId = await db.tasks.add({ title: title.trim(), dateEpochDay: currentEpochDay, timeText: timeText.trim() || null, priority, isCompleted: false });
            } else {
                await db.tasks.update(taskId, { title: title.trim(), timeText: timeText.trim() || null, priority });
                await db.subtasks.where('taskId').equals(taskId).delete();
            }
            for (const subTitle of subtasks) {
                await db.subtasks.add({ taskId, title: subTitle, isCompleted: false });
            }
        });
        onClose();
    };

    return (
        <div className="bg-card-dark border border-border-dark rounded-[20px] p-6 lg:p-8 w-full max-w-md flex flex-col gap-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center">
                <h3 className="text-[20px] font-bold text-text-primary-dark tracking-tight">{initialTask ? 'Настройки задачи' : 'Новая задача'}</h3>
                <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-text-secondary-dark uppercase tracking-wider">Название</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                    placeholder="Что планируем?"
                    className="w-full bg-item-dark border border-border-dark rounded-[14px] px-4 py-3.5 text-[15px] text-text-primary-dark outline-none focus:border-text-primary-dark transition-colors"
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-text-secondary-dark uppercase tracking-wider">Время</label>
                    <CustomTimePicker value={timeText} onChange={setTimeText} />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-text-secondary-dark uppercase tracking-wider">Приоритет</label>
                    <div className="relative">
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as PriorityType)}
                            className="w-full appearance-none bg-item-dark border border-border-dark rounded-[14px] px-4 py-3.5 text-[15px] text-text-primary-dark outline-none focus:border-text-primary-dark transition-colors cursor-pointer"
                        >
                            {(['LOW', 'MEDIUM', 'HIGH'] as PriorityType[]).map((p) => (
                                <option key={p} value={p}>{PRIORITIES[p].title}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary-dark">
                            <ChevronDown size={16}/>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <label className="text-[11px] font-bold text-text-secondary-dark uppercase tracking-wider">Подзадачи</label>
                {subtasks.length > 0 && (
                    <div className="flex flex-col gap-2 mb-1">
                        {subtasks.map((st, i) => (
                            <div key={i} className="flex items-center gap-3 bg-item-dark px-4 py-3 rounded-[14px] border border-border-dark group">
                                <span className="text-[14px] text-text-primary-dark flex-1 truncate">{st}</span>
                                <button type="button" onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))} className="text-text-secondary-dark hover:text-[#ef4444] transition-colors"><X size={14} /></button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSubtask();
                            }
                        }}
                        placeholder="Добавить шаг..."
                        className="flex-1 bg-item-dark border border-border-dark rounded-[14px] px-4 py-3.5 text-[14px] text-text-primary-dark outline-none focus:border-text-primary-dark transition-colors"
                    />
                    <button type="button" onClick={handleAddSubtask} className="w-12 h-auto bg-item-dark border border-border-dark hover:border-text-primary-dark rounded-[14px] flex items-center justify-center text-text-secondary-dark hover:text-text-primary-dark transition-colors">
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            <button type="button" onClick={handleSave} disabled={!title.trim()} className="w-full bg-text-primary-dark disabled:opacity-40 text-bg-dark font-bold text-[15px] py-4 rounded-[16px] shadow-md mt-4 transition-transform active:scale-[0.98]">
                Сохранить (Enter)
            </button>
        </div>
    );
};