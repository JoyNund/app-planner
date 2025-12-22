'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface TaskModalContextType {
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
}

const TaskModalContext = createContext<TaskModalContextType | undefined>(undefined);

export function TaskModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <TaskModalContext.Provider
            value={{
                isOpen,
                openModal: () => setIsOpen(true),
                closeModal: () => setIsOpen(false),
            }}
        >
            {children}
        </TaskModalContext.Provider>
    );
}

export function useTaskModal() {
    const context = useContext(TaskModalContext);
    if (!context) {
        throw new Error('useTaskModal must be used within TaskModalProvider');
    }
    return context;
}

