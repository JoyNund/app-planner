'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface UserModalContextType {
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
}

const UserModalContext = createContext<UserModalContextType | undefined>(undefined);

export function UserModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <UserModalContext.Provider
            value={{
                isOpen,
                openModal: () => setIsOpen(true),
                closeModal: () => setIsOpen(false),
            }}
        >
            {children}
        </UserModalContext.Provider>
    );
}

export function useUserModal() {
    const context = useContext(UserModalContext);
    if (!context) {
        throw new Error('useUserModal must be used within UserModalProvider');
    }
    return context;
}

