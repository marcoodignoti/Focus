import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, ScrollView, Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { useSharedValue, useAnimatedProps, createAnimatedComponent, useDerivedValue, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TextInput } from 'react-native';

import { GlassView } from 'expo-glass-effect';
import { canUseGlass } from '@/lib/glassCapability';
import { BlurView } from 'expo-blur';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSheetAnimation } from '@/hooks/useSheetAnimation';
import { getIconColor } from '@/lib/constants';
import * as haptics from '@/utils/haptics';
import { GlassIconButton } from '@/components/GlassIconButton';
import { useFocusModes } from '@/features/modes/store/useFocusModes';
import { useFocusHistory } from '@/features/calendar/store/useFocusHistory';
import { RulerPicker } from '@/features/modes/components/RulerPicker';
import { FocusMode } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedTextInput = createAnimatedComponent(TextInput);

export default function AddSessionScreen() {
    const router = useRouter();
    const { date } = useLocalSearchParams<{ date: string }>();

    const modes = useFocusModes(state => state.modes);
    const addSession = useFocusHistory(state => state.addSession);

    // Default to first mode
    const [selectedMode, setSelectedMode] = useState<FocusMode>(modes[0]);

    // Parse date from route param, default to now
    const baseDate = date ? new Date(date) : new Date();
    const [startTime, setStartTime] = useState(() => {
        const d = new Date(baseDate);
        // Round to current hour
        d.setMinutes(0, 0, 0);
        return d;
    });

    const { gesture, closeWithAnimation, animatedSheetStyle, animatedBackdropStyle } = useSheetAnimation(() => {
        router.back();
    });

    const sharedDuration = useSharedValue(selectedMode.duration);

    // Ref to mirror sharedDuration on JS thread
    const durationRef = useRef(selectedMode.duration);

    const syncDurationRef = (v: number) => {
        durationRef.current = v;
    };

    useAnimatedReaction(
        () => sharedDuration.value,
        (current) => {
            runOnJS(syncDurationRef)(current);
        }
    );

    const derivedDurationText = useDerivedValue(() => {
        return `${Math.round(sharedDuration.value)} min`;
    });

    const durationTextProps = useAnimatedProps(() => {
        return {
            text: derivedDurationText.value,
        } as any;
    });

    function handleSave() {
        haptics.notifySuccess();
        addSession({
            modeId: selectedMode.id,
            modeTitle: selectedMode.name,
            color: getIconColor(selectedMode.icon),
            startTime: startTime.getTime(),
            duration: Math.round(durationRef.current),
        });
        closeWithAnimation();
    }

    function handleSelectMode(mode: FocusMode) {
        haptics.impactLight();
        setSelectedMode(mode);
        sharedDuration.value = mode.duration;
        durationRef.current = mode.duration;
    }

    const useGlass = canUseGlass();

    const content = (
        <View style={[
            styles.contentContainer,
            !useGlass && { paddingBottom: 24 }
        ]}>
            {/* Header */}
            <View style={styles.sheetHeader}>
                <GlassIconButton
                    icon="close"
                    onPress={closeWithAnimation}
                    noGlass
                />

                <Text style={styles.sheetTitle}>Nuova Sessione</Text>

                <GlassIconButton
                    icon="checkmark"
                    onPress={handleSave}
                    noGlass
                />
            </View>

            {/* Mode Picker */}
            <View style={styles.inputSection}>
                <Text style={styles.sectionLabel}>Modalità</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.modeScroll}
                >
                    {modes.map((mode) => {
                        const isActive = mode.id === selectedMode.id;
                        const color = getIconColor(mode.icon);
                        return (
                            <Pressable
                                key={mode.id}
                                style={({ pressed }) => [
                                    styles.modePill,
                                    isActive && { backgroundColor: color },
                                    { opacity: pressed ? 0.7 : 1 }
                                ]}
                                onPress={() => handleSelectMode(mode)}
                            >
                                <Ionicons
                                    name={mode.icon}
                                    size={18}
                                    color={isActive ? '#000' : '#fff'}
                                />
                                <Text style={[
                                    styles.modePillText,
                                    isActive && { color: '#000' }
                                ]}>
                                    {mode.name}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Start Time Picker */}
            <View style={styles.inputSection}>
                <Text style={styles.sectionLabel}>Ora di inizio</Text>
                <View style={styles.timePickerContainer}>
                    <DateTimePicker
                        value={startTime}
                        mode="time"
                        display="spinner"
                        onChange={(_, selectedDate) => {
                            if (selectedDate) {
                                // Keep the base date, update time only
                                const newDate = new Date(baseDate);
                                newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
                                setStartTime(newDate);
                            }
                        }}
                        themeVariant="dark"
                        style={styles.timePicker}
                        locale="it-IT"
                    />
                </View>
            </View>

            {/* Duration Picker */}
            <View style={styles.inputSection}>
                <View style={styles.durationHeader}>
                    <Text style={styles.sectionLabel}>Durata</Text>
                    <AnimatedTextInput
                        editable={false}
                        style={styles.durationValue}
                        animatedProps={durationTextProps}
                    />
                </View>
                <View style={styles.rulerContainer}>
                    <RulerPicker
                        containerWidth={SCREEN_WIDTH - 64}
                        initialValue={selectedMode.duration}
                        sharedValue={sharedDuration}
                        height={100}
                    />
                </View>
            </View>
        </View>
    );

    const renderContainer = () => {
        if (useGlass) {
            return (
                <GlassView
                    style={styles.sheetContainer}
                    isInteractive
                    glassEffectStyle="regular"
                    colorScheme="dark"
                >
                    {content}
                </GlassView>
            );
        }

        return (
            <View style={[
                styles.sheetContainer,
                Platform.OS !== 'ios' && styles.fallbackContainer,
            ]}>
                {Platform.OS === 'ios' && (
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                )}
                {content}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior="padding"
        >
            <Animated.View style={[StyleSheet.absoluteFill, animatedBackdropStyle]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={closeWithAnimation}>
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
                </Pressable>
            </Animated.View>

            <GestureDetector gesture={gesture}>
                <Animated.View style={[
                    styles.wrapper,
                    animatedSheetStyle,
                ]}>
                    {renderContainer()}
                </Animated.View>
            </GestureDetector>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    wrapper: {
        width: '100%',
        paddingHorizontal: 8,
        paddingBottom: Platform.OS === 'ios' ? 8 : 24,
    },
    sheetContainer: {
        borderRadius: 32,
        overflow: 'hidden',
    },
    fallbackContainer: {
        backgroundColor: 'rgba(40, 40, 40, 0.85)',
    },
    contentContainer: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        alignItems: 'stretch',
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },

    sheetTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontFamily: 'SF-Pro-Rounded-Bold',
        textAlign: 'center',
    },
    inputSection: {
        marginBottom: 28,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontFamily: 'SF-Pro-Rounded-Semibold',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    modeScroll: {
        paddingRight: 20,
    },
    modePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginRight: 10,
    },
    modePillText: {
        color: '#ffffff',
        fontSize: 15,
        fontFamily: 'SF-Pro-Rounded-Semibold',
    },
    timePickerContainer: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
    },
    timePicker: {
        height: 120,
        width: SCREEN_WIDTH - 64,
    },
    durationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    durationValue: {
        color: '#ffffff',
        fontSize: 18,
        fontFamily: 'SF-Pro-Rounded-Bold',
    },
    rulerContainer: {
        height: 100,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        overflow: 'hidden',
    },
});
