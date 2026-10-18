import React, { useState } from 'react';
import { Check, Clock, Edit2, Trash2, Calendar as RescheduleIcon, ChevronDown } from 'lucide-react';
import type { Task, Subtask } from '../../types';
import { PRIORITIES } from '../../types';

interface TaskItemProps {
    task: Task;
    onToggle: () => void;
    onToggleSubtask: (subtask: Subtask) => void;
    onEdit: () => void;
    onReschedule: () => void;
    onDelete: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onToggleSubtask, onEdit, onReschedule, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const priority = PRIORITIES[task.priority] || PRIORITIES.MEDIUM;
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;

    return (
        <div className="group bg-card-dark border border-border-dark rounded-[16px] p-5 flex flex-col transition-colors hover:border-white/10 shadow-sm">
            <div className="flex items-center gap-4">
                <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: priority.color, boxShadow: `0 0 10px ${priority.color}80` }}
                />

                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => hasSubtasks && setIsExpanded(!isExpanded)}>
                    <div className="flex items-center gap-2">
            <span className={`text-[15px] font-semibold truncate transition-colors ${task.isCompleted ? 'line-through text-text-secondary-dark' : 'text-text-primary-dark'}`}>
              {task.title}
            </span>
                        {hasSubtasks && (
                            <span className={`text-text-secondary-dark transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                <ChevronDown size={16} />
              </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[12px] font-mono text-text-secondary-dark">
                        {task.timeText && <span className="flex items-center gap-1.5"><Clock size={12} />{task.timeText}</span>}
                        <span style={{ color: priority.color }}>{task.priority}</span>
                        {hasSubtasks && <span>Steps: {task.subtasks!.filter(s => s.isCompleted).length}/{task.subtasks!.length}</span>}
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={onReschedule} title="Перенести" className="p-2 rounded border border-transparent hover:border-border-dark text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-all"><RescheduleIcon size={14} /></button>
                    <button type="button" onClick={onEdit} title="Редактировать" className="p-2 rounded border border-transparent hover:border-border-dark text-text-secondary-dark hover:text-text-primary-dark hover:bg-item-dark transition-all"><Edit2 size={14} /></button>
                    <button type="button" onClick={onDelete} title="Удалить" className="p-2 rounded border border-transparent hover:border-border-dark text-text-secondary-dark hover:text-[#ef4444] hover:bg-item-dark transition-all"><Trash2 size={14} /></button>
                </div>

                <button type="button" onClick={onToggle} className={`ml-2 w-6 h-6 flex-shrink-0 rounded border flex items-center justify-center transition-all ${task.isCompleted ? 'bg-text-primary-dark border-text-primary-dark text-bg-dark scale-105' : 'border-text-secondary-dark hover:border-text-primary-dark text-transparent'}`}>
                    <Check size={14} strokeWidth={3} />
                </button>
            </div>

            {hasSubtasks && (
                <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                    <div className="overflow-hidden">
                        <div className="pl-6 pt-3 pb-1 border-t border-border-dark flex flex-col gap-3">
                            {task.subtasks!.map((subtask) => (
                                <div key={subtask.id} onClick={() => onToggleSubtask(subtask)} className="flex items-center gap-3 cursor-pointer group/sub">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${subtask.isCompleted ? 'bg-text-secondary-dark border-text-secondary-dark text-bg-dark' : 'border-border-dark group-hover/sub:border-text-secondary-dark text-transparent'}`}>
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    <span className={`text-[13px] transition-colors ${subtask.isCompleted ? 'line-through text-text-secondary-dark' : 'text-text-primary-dark'}`}>
                    {subtask.title}
                  </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};