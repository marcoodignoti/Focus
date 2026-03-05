import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, TextInput, ScrollView, Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { useSharedValue, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { GlassView } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSheetAnimation } from '@/hooks/useSheetAnimation';
import { CURATED_ICONS } from '@/lib/constants';
import { canUseGlass } from '@/lib/glassCapability';
import * as haptics from '@/utils/haptics';
import { GlassIconButton } from '@/components/GlassIconButton';
import { useFocusModes } from '@/features/modes/store/useFocusModes';
import { RulerPicker } from '@/features/modes/components/RulerPicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');


export default function NewModeScreen() {
    const router = useRouter();
    const handleCreateMode = useFocusModes(state => state.handleCreateMode);

    const [name, setName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>('flash');

    const { gesture, closeWithAnimation, animatedSheetStyle, animatedBackdropStyle, isReady } = useSheetAnimation(() => {
        router.back();
    });

    const sharedDuration = useSharedValue(25);

    // Ref to mirror sharedDuration on JS thread without reading .value during render
    const durationRef = useRef(25);

    const syncDurationRef = (v: number) => {
        durationRef.current = v;
    };

    useAnimatedReaction(
        () => sharedDuration.value,
        (current) => {
            runOnJS(syncDurationRef)(current);
        }
    );


    function handleSave() {
        if (!name.trim()) return;
        haptics.notifySuccess();
        handleCreateMode({ name: name.trim(), duration: Math.round(durationRef.current), icon: selectedIcon });
        closeWithAnimation();
    }

    const isSaveDisabled = !name.trim();
    const useGlass = canUseGlass();

    const content = (
        <View style={[
            styles.contentContainer,
            !useGlass && { paddingBottom: 24 }
        ]}>
            <View style={styles.sheetHeader}>
                <GlassIconButton
                    icon="close"
                    onPress={closeWithAnimation}
                    noGlass
                />

                <Text style={styles.sheetTitle}>New Mode</Text>

                <GlassIconButton
                    icon="checkmark"
                    onPress={handleSave}
                    disabled={isSaveDisabled}
                    noGlass
                />
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.sectionLabel}>Name</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Deep Work"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={name}
                    onChangeText={setName}
                    maxLength={15}
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
                    autoFocus={false}
                />
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.sectionLabel}>Icon</Text>
                <View style={styles.iconGrid}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconScroll}>
                        {CURATED_ICONS.map(icon => (
                            <Pressable
                                key={icon}
                                style={({ pressed }) => [
                                    styles.iconBox,
                                    selectedIcon === icon ? styles.iconBoxSelected : null,
                                    { opacity: pressed ? 0.7 : 1 }
                                ]}
                                onPress={() => {
                                    haptics.impactLight();
                                    setSelectedIcon(icon);
                                }}
                            >
                                <Ionicons
                                    name={icon}
                                    size={28}
                                    color={selectedIcon === icon ? '#000' : '#fff'}
                                />
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            </View>

            <View style={styles.inputSection}>
                <View style={styles.rulerContainer}>
                    {isReady ? (
                        <RulerPicker
                            containerWidth={SCREEN_WIDTH - 64}
                            initialValue={25}
                            sharedValue={sharedDuration}
                            height={100}
                        />
                    ) : null}
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
        marginBottom: 32,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontFamily: 'SF-Pro-Rounded-Semibold',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 50,
        padding: 16,
        paddingHorizontal: 20,
        color: '#ffffff',
        fontSize: 18,
        fontFamily: 'SF-Pro-Rounded-Semibold',
    },
    iconGrid: {
        flexDirection: 'row',
    },
    iconScroll: {
        paddingRight: 20,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconBoxSelected: {
        backgroundColor: '#ffffff',
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
