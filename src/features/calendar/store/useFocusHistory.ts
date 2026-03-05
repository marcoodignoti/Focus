import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { FocusSession } from '@/lib/types';

interface FocusHistoryState {
    sessions: FocusSession[];
    addSession: (session: Omit<FocusSession, 'id'>) => void;
    deleteSession: (id: string) => void;
    clearHistory: () => void;
}

export const useFocusHistory = create<FocusHistoryState>()(
    persist(
        (set) => ({
            sessions: [],
            addSession: (session) => set((state) => ({
                sessions: [...state.sessions, { ...session, id: Date.now().toString() }]
            })),
            deleteSession: (id) => set((state) => ({
                sessions: state.sessions.filter(s => s.id !== id)
            })),
            clearHistory: () => set({ sessions: [] }),
        }),
        {
            name: 'focus-history-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
