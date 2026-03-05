import { useState, useEffect, ReactNode, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import { useSharedValue, useAnimatedStyle, withTiming, runOnJS, useDerivedValue, cancelAnimation, Easing } from 'react-native-reanimated';
import PagerView from 'react-native-pager-view';
import Animated from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';

import { TimerDisplay } from '@/features/timer/components/TimerDisplay';
import { ModeSelector } from '@/features/modes/components/ModeSelector';
import { StartButton } from '@/features/timer/components/StartButton';
import { ModeSelectionOverlay } from '@/features/modes/components/ModeSelectionOverlay';
import { GlassContainer } from '@/components/GlassContainer';
import { FocusMode } from '@/lib/types';
import { RulerOverlay } from '@/features/modes/components/RulerOverlay';
import * as haptics from '@/utils/haptics';
import { useFocusModes } from '@/features/modes/store/useFocusModes';
import { useFocusAnimations } from '@/features/timer/hooks/useFocusAnimations';
import { useFocusHistory } from '@/features/calendar/store/useFocusHistory';
import { getIconColor } from '@/lib/constants';
import CalendarView from '@/features/calendar/components/CalendarView';
import { useUIStore } from '@/hooks/useUIStore';

function OverlayLayer() {
    const isModeSelectionVisible = useUIStore(state => state.isModeSelectionVisible);
    const setModeSelectionVisible = useUIStore(state => state.setModeSelectionVisible);
    const isRulerVisible = useUIStore(state => state.isRulerVisible);
    const setRulerVisible = useUIStore(state => state.setRulerVisible);

    const currentMode = useFocusModes(state => state.currentMode);
    const modes = useFocusModes(state => state.modes);
    const defaultModeId = useFocusModes(state => state.defaultModeId);
    const updateModeParams = useFocusModes(state => state.updateModeParams);
    const handleSetDefaultMode = useFocusModes(state => state.handleSetDefaultMode);
    const handleDeleteMode = useFocusModes(state => state.handleDeleteMode);
    const setCurrentMode = useFocusModes(state => state.setCurrentMode);
    const resetTimer = useFocusModes(state => state.resetTimer);

    function handleSelectMode(mode: FocusMode) {
        haptics.selection();
        setCurrentMode(mode);
        resetTimer();
        setModeSelectionVisible(false);
    }

    return (
        <>
            {isModeSelectionVisible ? (
                <ModeSelectionOverlay
                    visible={isModeSelectionVisible}
                    onClose={() => setModeSelectionVisible(false)}
                    modes={modes}
                    activeModeId={currentMode.id}
                    defaultModeId={defaultModeId}
                    onSelectMode={handleSelectMode}
                    onUpdateModeIcon={(id: string, icon: any) => updateModeParams(id, { icon })}
                    onSetDefaultMode={(id: string) => handleSetDefaultMode(id, false)}
                    onDeleteMode={(id: string) => handleDeleteMode(id, false)}
                />
            ) : null}

            <RulerOverlay
                visible={isRulerVisible}
                onClose={() => setRulerVisible(false)}
                initialValue={currentMode.duration}
                onValueChange={(val) => updateModeParams(currentMode.id, { duration: val })}
            />
        </>
    );
}

// Thin wrapper that subscribes to overlay visibility and controls PagerView scrollEnabled
function PagerWrapper({ isActive, onPageChange, children }: { isActive: boolean; onPageChange: (page: number) => void; children: ReactNode }) {
    const isRulerVisible = useUIStore(state => state.isRulerVisible);
    const isModeSelectionVisible = useUIStore(state => state.isModeSelectionVisible);

    return (
        <PagerView
            style={styles.container}
            initialPage={0}
            scrollEnabled={!isActive && !isRulerVisible && !isModeSelectionVisible}
            onPageSelected={(e) => onPageChange(e.nativeEvent.position)}
        >
            {children}
        </PagerView>
    );
}

export default function HomeScreen() {
    const router = useRouter();

    // Store state
    const modes = useFocusModes(state => state.modes);
    const currentMode = useFocusModes(state => state.currentMode);
    const defaultModeId = useFocusModes(state => state.defaultModeId);
    const timerResetKey = useFocusModes(state => state.timerResetKey);
    const pomodoroState = useFocusModes(state => state.pomodoroState);

    // Actions
    const setCurrentMode = useFocusModes(state => state.setCurrentMode);
    const resetTimer = useFocusModes(state => state.resetTimer);
    const updateModeParams = useFocusModes(state => state.updateModeParams);
    const handleSetDefaultMode = useFocusModes(state => state.handleSetDefaultMode);
    const handleDeleteMode = useFocusModes(state => state.handleDeleteMode);
    const nextPomodoroPhase = useFocusModes(state => state.nextPomodoroPhase);
    const resetPomodoro = useFocusModes(state => state.resetPomodoro);

    const addSession = useFocusHistory(state => state.addSession);
    const clearHistory = useFocusHistory(state => state.clearHistory);

    // Local state
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [activePage, setActivePage] = useState(0);
    const accumulatedFocusMinutesRef = useRef(0);

    // UI Store
    const setRulerVisible = useUIStore(state => state.setRulerVisible);
    const setModeSelectionVisible = useUIStore(state => state.setModeSelectionVisible);

    // Derived State
    const focusSeconds = currentMode.duration * 60;
    const rule = pomodoroState.phase === 'short_break' ? 0.2 : 0.6;
    const breakSeconds = focusSeconds * rule;
    const roundedBreakSeconds = breakSeconds > 60 ? Math.ceil(breakSeconds / 60) * 60 : Math.ceil(breakSeconds);

    const currentDurationSeconds = pomodoroState.phase === 'focus' ? focusSeconds : roundedBreakSeconds;

    function saveAccumulatedSession() {
        const totalMinutes = accumulatedFocusMinutesRef.current;
        if (totalMinutes > 0 && sessionStartTime) {
            const modeColor = getIconColor(currentMode.icon);
            addSession({
                modeId: currentMode.id,
                modeTitle: currentMode.name,
                color: modeColor,
                startTime: sessionStartTime,
                duration: totalMinutes,
            });
        }
        accumulatedFocusMinutesRef.current = 0;
    }

    function stopFocus() {
        saveAccumulatedSession();
        setIsActive(false);
        resetTimer();
        resetPomodoro();
        setSessionStartTime(null);
        stopFocusAnimation();
    }

    const {
        fadeAnim,
        progressBarOpacityAnim,
        progressScaleX,
        startFocusAnimation,
        stopFocusAnimation,
        handlePressIn,
        handlePressOut,
    } = useFocusAnimations(isActive, stopFocus);

    const derivedInvertedFade = useDerivedValue(() => {
        return 1 - fadeAnim.value;
    });

    // Animated Styles (Tutto sul UI Thread)
    const fadeStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value,
    }));

    const invertedFadeStyle = useAnimatedStyle(() => ({
        opacity: derivedInvertedFade.value,
    }));

    const progressStyle = useAnimatedStyle(() => ({
        transform: [
            { scaleX: progressScaleX.value }
        ],
    }));

    const progressBarOpacityStyle = useAnimatedStyle(() => ({
        opacity: progressBarOpacityAnim.value,
    }));

    // Handler Logic
    function handleTimerComplete() {
        haptics.notifySuccess();

        if (pomodoroState.phase === 'focus') {
            accumulatedFocusMinutesRef.current += currentMode.duration;
        }

        // Full pomodoro cycle done (long break ended) → save & start fresh
        if (pomodoroState.phase === 'long_break') {
            saveAccumulatedSession();
            setSessionStartTime(Date.now());
        }

        nextPomodoroPhase();
        setIsActive(true);
        startFocusAnimation();
    }

    function startFocus() {
        haptics.impactMedium();
        setIsActive(true);
        setSessionStartTime(Date.now());
        accumulatedFocusMinutesRef.current = 0;
        startFocusAnimation();
    }

    function toggleRuler() {
        if (isActive) return;
        haptics.impactLight();
        setRulerVisible(true);
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: activePage === 1,
                    headerTransparent: true,
                    title: '',
                    headerTintColor: '#fff',
                    headerShadowVisible: false,
                }}
            />
            {activePage === 1 && (
                <Stack.Toolbar placement="right">
                    <Stack.Toolbar.Button
                        icon="trash"
                        onPress={() => {
                            Alert.alert(
                                'Svuota Cronologia',
                                'Sei sicuro di voler eliminare tutte le sessioni del calendario?',
                                [
                                    { text: 'Annulla', style: 'cancel' },
                                    {
                                        text: 'Svuota',
                                        style: 'destructive',
                                        onPress: () => {
                                            clearHistory();
                                            haptics.notifySuccess();
                                        },
                                    },
                                ]
                            );
                        }}
                    />
                    <Stack.Toolbar.Button icon="plus" onPress={() => {
                        const selectedDate = useUIStore.getState().selectedDate;
                        router.push({ pathname: '/add-session', params: { date: selectedDate.toISOString() } });
                    }} />
                </Stack.Toolbar>
            )}
            <PagerWrapper isActive={isActive} onPageChange={setActivePage}>
                <View key="1" style={styles.container}>
                    {/* Sfondo fisso */}
                    <View style={[styles.background, { backgroundColor: '#111116' }]} />

                    {/* Sfondo animato sul UI Thread */}
                    <Animated.View style={[styles.background, { backgroundColor: '#1C1D2A' }, fadeStyle]} />

                    <Pressable
                        style={styles.pressableArea}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        disabled={!isActive}
                    >
                        <View style={styles.content}>
                            <View style={styles.topSection}>
                                <Animated.View style={[styles.phaseTitleContainer, fadeStyle]}>
                                    <Text style={styles.phaseTitle}>
                                        {pomodoroState.phase === 'focus' ? 'Focus' :
                                            pomodoroState.phase === 'short_break' ? 'Short Break' : 'Long Break'}
                                    </Text>
                                </Animated.View>

                                <Pressable
                                    onPress={toggleRuler}
                                    disabled={isActive}
                                    style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                                >
                                    <TimerDisplay
                                        key={`${currentMode.id}-${pomodoroState.phase}-${pomodoroState.sessionCount}-${timerResetKey}`}
                                        durationSeconds={currentDurationSeconds}
                                        isActive={isActive}
                                        onComplete={handleTimerComplete}
                                    />
                                </Pressable>

                                <View style={styles.selectorContainer}>
                                    <Animated.View
                                        style={[
                                            styles.modeSelector,
                                            invertedFadeStyle
                                        ]}
                                        pointerEvents={isActive ? 'none' : 'auto'}
                                    >
                                        <ModeSelector
                                            mode={currentMode.name}
                                            icon={currentMode.icon}
                                            onPress={() => setModeSelectionVisible(true)}
                                            parentOpacity={derivedInvertedFade}
                                        />
                                    </Animated.View>
                                </View>

                                <Animated.View style={[styles.sessionDots, fadeStyle]}>
                                    {[1, 2, 3, 4].map((i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.dot,
                                                i < pomodoroState.sessionCount && styles.dotCompleted,
                                                i === pomodoroState.sessionCount && pomodoroState.phase === 'focus' && styles.dotActive,
                                                i === pomodoroState.sessionCount && pomodoroState.phase !== 'focus' && styles.dotBreak,
                                            ]}
                                        />
                                    ))}
                                </Animated.View>
                            </View>

                            <Animated.View
                                style={[styles.bottomSection, invertedFadeStyle]}
                                pointerEvents={isActive ? 'none' : 'auto'}
                            >
                                <StartButton
                                    label="Start Focus"
                                    onPress={startFocus}
                                />
                            </Animated.View>

                            <Animated.View
                                style={[styles.holdToStopContainer, fadeStyle]}
                                pointerEvents="none"
                            >
                                <Text style={styles.holdText}>Hold to stop focus</Text>
                                <Animated.View style={[styles.progressBarBackground, progressBarOpacityStyle]}>
                                    <Animated.View style={[
                                        styles.progressBarFill,
                                        progressStyle
                                    ]} />
                                </Animated.View>
                            </Animated.View>
                        </View>
                    </Pressable>
                </View>
                <View key="2" style={styles.container}>
                    <CalendarView />
                </View>
            </PagerWrapper>
            <OverlayLayer />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    pressableArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingTop: 60,
        paddingBottom: 60,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topSection: {
        alignItems: 'center',
        marginTop: 150,
    },
    selectorContainer: {
        marginTop: 10,
        height: 100,
        width: 300,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeSelector: {
        position: 'absolute',
    },
    bottomSection: {
        position: 'absolute',
        bottom: 110,
    },
    holdToStopContainer: {
        position: 'absolute',
        bottom: 110,
        alignItems: 'center',
    },
    holdText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'SF-Pro-Rounded-Semibold',
        marginBottom: 14,
    },
    progressBarBackground: {
        width: 180,
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 4,
    },
    breakIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    breakText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'SF-Pro-Rounded-Semibold',
    },
    sessionDots: {
        flexDirection: 'row',
        marginTop: -80,
        gap: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    dotCompleted: {
        backgroundColor: '#fff',
    },
    dotActive: {
        backgroundColor: '#4CD964',
        transform: [{ scale: 1.2 }],
    },
    dotBreak: {
        backgroundColor: '#FF9500',
        transform: [{ scale: 1.2 }],
    },
    phaseTitleContainer: {
        position: 'absolute',
        top: -112,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    phaseTitle: {
        color: '#ffffff',
        fontSize: 14,
        fontFamily: 'SF-Pro-Rounded-Semibold',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        opacity: 0.6,
        textAlign: 'center',
    },
});
