import { create } from 'zustand';

interface UIState {
    isRulerVisible: boolean;
    isModeSelectionVisible: boolean;
    selectedDate: Date;
    setRulerVisible: (visible: boolean) => void;
    setModeSelectionVisible: (visible: boolean) => void;
    setSelectedDate: (date: Date) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isRulerVisible: false,
    isModeSelectionVisible: false,
    selectedDate: new Date(),
    setRulerVisible: (visible) => set({ isRulerVisible: visible }),
    setModeSelectionVisible: (visible) => set({ isModeSelectionVisible: visible }),
    setSelectedDate: (date) => set({ selectedDate: date }),
}));
