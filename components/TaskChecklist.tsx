'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, Circle } from 'lucide-react';

interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

interface TaskChecklistProps {
    taskId: number;
    items: ChecklistItem[];
    onUpdate: () => void;
}

export default function TaskChecklist({ taskId, items, onUpdate }: TaskChecklistProps) {
    const [updating, setUpdating] = useState<string | null>(null);
    const [localItems, setLocalItems] = useState(items);
    const isUpdatingRef = useRef(false);
    
    // Sync local state with props, but only when we're not in the middle of an update
    useEffect(() => {
        if (!isUpdatingRef.current) {
            setLocalItems(items);
        }
    }, [items]);

    const toggleItem = async (itemId: string) => {
        setUpdating(itemId);
        isUpdatingRef.current = true;
        
        // Optimistic update
        const newItems = localItems.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        setLocalItems(newItems);
        
        try {
            const res = await fetch(`/api/tasks/${taskId}/checklist`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: newItems }),
            });
            
            if (!res.ok) {
                // Revert on error
                setLocalItems(items);
                console.error('Error updating checklist:', await res.text());
            }
            // Don't call onUpdate() - keep local state as source of truth
        } catch (error) {
            console.error('Error updating checklist:', error);
            setLocalItems(items);
        } finally {
            setUpdating(null);
            isUpdatingRef.current = false;
        }
    };

    const completedCount = localItems.filter(i => i.checked).length;
    const totalCount = localItems.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
            {/* Progress bar */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-md)',
            }}>
                <div style={{
                    flex: 1,
                    height: '6px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: progress === 100 ? 'var(--status-completed)' : 'var(--accent-primary)',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease',
                    }} />
                </div>
                <span style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)',
                    minWidth: '50px',
                    textAlign: 'right',
                }}>
                    {completedCount}/{totalCount}
                </span>
            </div>
            
            {/* Checklist items */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-xs)',
            }}>
                {localItems.map(item => (
                    <div
                        key={item.id}
                        onClick={() => !updating && toggleItem(item.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 'var(--spacing-sm)',
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            background: item.checked ? 'rgba(34, 197, 94, 0.05)' : 'var(--glass-bg)',
                            borderRadius: 'var(--radius-md)',
                            cursor: updating ? 'wait' : 'pointer',
                            transition: 'all 0.2s',
                            border: '1px solid',
                            borderColor: item.checked ? 'rgba(34, 197, 94, 0.2)' : 'var(--glass-border)',
                            opacity: updating === item.id ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!updating) {
                                e.currentTarget.style.background = item.checked 
                                    ? 'rgba(34, 197, 94, 0.1)' 
                                    : 'var(--glass-bg-medium)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = item.checked 
                                ? 'rgba(34, 197, 94, 0.05)' 
                                : 'var(--glass-bg)';
                        }}
                    >
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                            background: item.checked ? 'var(--status-completed)' : 'transparent',
                            border: item.checked ? 'none' : '2px solid var(--border-color)',
                            transition: 'all 0.2s',
                        }}>
                            {item.checked && <Check size={12} color="white" strokeWidth={3} />}
                        </div>
                        <span style={{
                            flex: 1,
                            fontSize: '0.9375rem',
                            lineHeight: '1.5',
                            color: item.checked ? 'var(--text-muted)' : 'var(--text-secondary)',
                            textDecoration: item.checked ? 'line-through' : 'none',
                            transition: 'all 0.2s',
                        }}>
                            {item.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Helper to check if description is a checklist
export function isChecklist(description: string | null): boolean {
    if (!description) return false;
    try {
        const parsed = JSON.parse(description);
        return parsed.type === 'checklist' && Array.isArray(parsed.items);
    } catch {
        return false;
    }
}

// Helper to parse checklist items
export function parseChecklistItems(description: string | null): ChecklistItem[] {
    if (!description) return [];
    try {
        const parsed = JSON.parse(description);
        if (parsed.type === 'checklist' && Array.isArray(parsed.items)) {
            return parsed.items;
        }
    } catch {
        // Not JSON
    }
    return [];
}
