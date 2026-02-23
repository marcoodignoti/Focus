import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FocusSession {
    id: string;
    modeId: string;
    startTime: number; // Unix timestamp
    duration: number; // Duration in minutes
}

interface FocusHistoryState {
    sessions: FocusSession[];
    addSession: (session: Omit<FocusSession, 'id'>) => void;
    clearHistory: () => void;
}

export const useFocusHistory = create<FocusHistoryState>()(
    persist(
        (set) => ({
            sessions: [],
            addSession: (session) => set((state) => ({
                sessions: [...state.sessions, { ...session, id: Date.now().toString() }]
            })),
            clearHistory: () => set({ sessions: [] }),
        }),
        {
            name: 'focus-history-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
