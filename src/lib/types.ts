import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type PomodoroPhase = 'focus' | 'short_break' | 'long_break';

export interface PomodoroState {
    phase: PomodoroPhase;
    sessionCount: number; // 1 to 4
}

export interface FocusMode {
    id: string;
    name: string;
    duration: number; // in minutes
    icon: keyof typeof Ionicons.glyphMap;
}

export interface FocusSession {
    id: string;
    modeId: string;
    modeTitle: string;
    color: string;
    startTime: number; // Unix timestamp
    duration: number; // Duration in minutes
}

