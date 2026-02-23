import { useState, useCallback } from 'react';
import { FocusMode } from '../components/ModeSelectionOverlay';
import { Ionicons } from '@expo/vector-icons';

const initialModes: FocusMode[] = [
    { id: '1', name: 'Study', duration: 35, icon: 'book' },
    { id: '2', name: 'Work', duration: 45, icon: 'briefcase' },
    { id: '3', name: 'Focus', duration: 15, icon: 'fitness' },
    { id: '4', name: 'Fitness', duration: 45, icon: 'barbell' },
    { id: '5', name: 'Read', duration: 20, icon: 'library' },
];

export const useFocusModes = () => {
    const [modes, setModes] = useState<FocusMode[]>(initialModes);
    const [defaultModeId, setDefaultModeId] = useState<string>(initialModes[0].id);
    const [currentMode, setCurrentMode] = useState<FocusMode>(() =>
        initialModes.find(m => m.id === initialModes[0].id) || initialModes[0]
    );
    const [timerResetKey, setTimerResetKey] = useState(0);

    const resetTimer = useCallback(() => {
        setTimerResetKey(prev => prev + 1);
    }, []);

    const updateModeParams = useCallback((id: string, updates: Partial<FocusMode>) => {
        setModes((prevModes) => prevModes.map(m => m.id === id ? { ...m, ...updates } : m));
        setCurrentMode((prev) => prev.id === id ? { ...prev, ...updates } : prev);
    }, []);

    const handleSetDefaultMode = useCallback((id: string, isActive: boolean) => {
        setDefaultModeId(id);
        const newDefault = modes.find(m => m.id === id);
        if (!isActive && newDefault) {
            setCurrentMode(newDefault);
            resetTimer();
        }
    }, [modes, resetTimer]);

    const handleDeleteMode = useCallback((id: string) => {
        setModes((prevModes) => {
            const remainingModes = prevModes.filter(m => m.id !== id);
            if (currentMode.id === id && remainingModes.length > 0) {
                setCurrentMode(remainingModes[0]);
                resetTimer();
            }
            if (defaultModeId === id && remainingModes.length > 0) {
                setDefaultModeId(remainingModes[0].id);
            }
            return remainingModes;
        });
    }, [currentMode.id, defaultModeId, resetTimer]);

    const handleCreateMode = useCallback((newModeParams: Omit<FocusMode, 'id'>) => {
        setModes((prevModes) => {
            const maxId = prevModes.reduce((max, mode) => {
                const idNum = parseInt(mode.id, 10);
                return isNaN(idNum) ? max : Math.max(max, idNum);
            }, 0);

            const newMode: FocusMode = {
                ...newModeParams,
                id: (maxId + 1).toString(),
            };

            return [...prevModes, newMode];
        });
    }, []);

    return {
        modes,
        currentMode,
        defaultModeId,
        timerResetKey,
        setCurrentMode,
        resetTimer,
        updateModeParams,
        handleSetDefaultMode,
        handleDeleteMode,
        handleCreateMode
    };
};
