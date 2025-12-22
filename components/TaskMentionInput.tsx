'use client';

import { useState, useRef, useEffect } from 'react';
import { detectMentionTrigger, filterTasksForMention, insertTaskMention } from '@/lib/taskMentions';

interface Task {
    id: number;
    task_id: string | null;
    title: string;
    status: string;
}

interface TaskMentionInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    tasks: Task[];
    placeholder?: string;
    disabled?: boolean;
}

export default function TaskMentionInput({
    value,
    onChange,
    onSubmit,
    tasks,
    placeholder = 'Escribe un mensaje...',
    disabled = false,
}: TaskMentionInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [mentionState, setMentionState] = useState<{
        isActive: boolean;
        type: 'slash' | 'hash';
        query: string;
        position: number;
        filteredTasks: Task[];
        selectedIndex: number;
    } | null>(null);

    // Handle input changes to detect mentions
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        const cursorPosition = e.target.selectionStart;
        const trigger = detectMentionTrigger(newValue, cursorPosition);

        if (trigger) {
            const filtered = filterTasksForMention(tasks, trigger.query);
            if (filtered.length > 0) {
                setMentionState({
                    isActive: true,
                    type: trigger.type as 'slash' | 'hash',
                    query: trigger.query,
                    position: trigger.position,
                    filteredTasks: filtered,
                    selectedIndex: 0,
                });
                return;
            }
        }

        setMentionState(null);
    };

    // Handle keyboard navigation for mention menu
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (mentionState?.isActive) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionState(prev => prev ? ({
                    ...prev,
                    selectedIndex: (prev.selectedIndex + 1) % prev.filteredTasks.length
                }) : null);
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionState(prev => prev ? ({
                    ...prev,
                    selectedIndex: (prev.selectedIndex - 1 + prev.filteredTasks.length) % prev.filteredTasks.length
                }) : null);
                return;
            }

            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                selectTask(mentionState.filteredTasks[mentionState.selectedIndex]);
                return;
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                setMentionState(null);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    const selectTask = (task: Task) => {
        if (!mentionState || !task.task_id) return;

        const cursorPosition = textareaRef.current?.selectionStart || 0;
        const { text, cursorPosition: newCursorPos } = insertTaskMention(
            value,
            { type: mentionState.type, position: mentionState.position, query: mentionState.query },
            task.task_id,
            cursorPosition
        );

        onChange(text);
        setMentionState(null);

        // Restore cursor position and focus after render
        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        });
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {/* Mention Menu */}
            {mentionState?.isActive && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        width: '300px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 -4px 12px rgba(0,0,0,0.2)',
                        zIndex: 50,
                        marginBottom: 'var(--spacing-xs)',
                    }}
                >
                    <div style={{
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                    }}>
                        {mentionState.type === 'slash' ? 'Seleccionar tarea' : 'Mencionar tarea'}
                    </div>
                    {mentionState.filteredTasks.map((task, index) => (
                        <button
                            key={task.id}
                            onClick={() => selectTask(task)}
                            style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: 'var(--spacing-sm)',
                                backgroundColor: index === mentionState.selectedIndex ? 'var(--accent-primary)' : 'transparent',
                                color: index === mentionState.selectedIndex ? 'white' : 'var(--text-primary)',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 500, marginRight: 'var(--spacing-sm)' }}>
                                    {task.title}
                                </span>
                                {task.task_id && (
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontFamily: 'monospace',
                                        opacity: 0.8
                                    }}>
                                        #{task.task_id}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    resize: 'none',
                    minHeight: '80px',
                    fontFamily: 'inherit',
                    fontSize: '0.9375rem',
                    outline: 'none',
                }}
            />
        </div>
    );
}
