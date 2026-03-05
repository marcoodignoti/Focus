import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FocusMode, PomodoroState, PomodoroPhase } from '@/lib/types';

const initialModes: FocusMode[] = [
    { id: '1', name: 'Study', duration: 35, icon: 'book' },
    { id: '2', name: 'Work', duration: 45, icon: 'briefcase' },
    { id: '3', name: 'Focus', duration: 15, icon: 'cafe' },
    { id: '4', name: 'Fitness', duration: 45, icon: 'barbell' },
    { id: '5', name: 'Read', duration: 20, icon: 'library' },
];

const initialPomodoroState: PomodoroState = {
    phase: 'focus',
    sessionCount: 1,
};

interface FocusModesState {
    modes: FocusMode[];
    defaultModeId: string;
    currentMode: FocusMode;
    timerResetKey: number;
    pomodoroState: PomodoroState;
    setCurrentMode: (mode: FocusMode) => void;
    resetTimer: () => void;
    updateModeParams: (id: string, updates: Partial<FocusMode>) => void;
    handleSetDefaultMode: (id: string, isActive: boolean) => void;
    handleDeleteMode: (id: string, isActive: boolean) => void;
    handleCreateMode: (newModeParams: Omit<FocusMode, 'id'>) => void;
    nextPomodoroPhase: () => void;
    resetPomodoro: () => void;
}

export const useFocusModes = create<FocusModesState>()(
    persist(
        (set, get) => ({
            modes: initialModes,
            defaultModeId: initialModes[0].id,
            currentMode: initialModes[0],
            timerResetKey: 0,
            pomodoroState: initialPomodoroState,

            setCurrentMode: (mode) => set({ currentMode: mode }),

            resetTimer: () => set((state) => ({ timerResetKey: state.timerResetKey + 1 })),

            updateModeParams: (id, updates) => {
                set((state) => {
                    const newModes = state.modes.map(m => m.id === id ? { ...m, ...updates } : m);
                    const newCurrentMode = state.currentMode.id === id ? { ...state.currentMode, ...updates } : state.currentMode;
                    return { modes: newModes, currentMode: newCurrentMode };
                });
            },

            handleSetDefaultMode: (id, isActive) => {
                set((state) => {
                    const newDefault = state.modes.find(m => m.id === id);
                    if (!isActive && newDefault) {
                        return { defaultModeId: id, currentMode: newDefault, timerResetKey: state.timerResetKey + 1 };
                    }
                    return { defaultModeId: id };
                });
            },

            handleDeleteMode: (id, isActive) => {
                set((state) => {
                    const remainingModes = state.modes.filter(m => m.id !== id);
                    if (remainingModes.length === 0) return state;

                    let nextState: Partial<FocusModesState> = { modes: remainingModes };

                    if (state.currentMode.id === id) {
                        nextState.currentMode = remainingModes[0];
                        nextState.timerResetKey = state.timerResetKey + 1;
                    }

                    if (state.defaultModeId === id) {
                        nextState.defaultModeId = remainingModes[0].id;
                    }

                    return nextState;
                });
            },

            handleCreateMode: (newModeParams) => {
                set((state) => {
                    const maxId = state.modes.reduce((max, mode) => {
                        const idNum = parseInt(mode.id, 10);
                        return isNaN(idNum) ? max : Math.max(max, idNum);
                    }, 0);

                    const newMode: FocusMode = {
                        ...newModeParams,
                        id: (maxId + 1).toString(),
                    };

                    return { modes: [...state.modes, newMode] };
                });
            },

            nextPomodoroPhase: () => {
                set((state) => {
                    const { phase, sessionCount } = state.pomodoroState;
                    let nextPhase: PomodoroPhase = 'focus';
                    let nextSessionCount = sessionCount;

                    if (phase === 'focus') {
                        if (sessionCount < 4) {
                            nextPhase = 'short_break';
                        } else {
                            nextPhase = 'long_break';
                        }
                    } else if (phase === 'short_break') {
                        nextPhase = 'focus';
                        nextSessionCount = sessionCount + 1;
                    } else if (phase === 'long_break') {
                        nextPhase = 'focus';
                        nextSessionCount = 1;
                    }

                    return {
                        pomodoroState: {
                            phase: nextPhase,
                            sessionCount: nextSessionCount,
                        },
                        timerResetKey: state.timerResetKey + 1,
                    };
                });
            },

            resetPomodoro: () => set({ pomodoroState: initialPomodoroState }),
        }),
        {
            name: 'focus-modes-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
