import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Pressable, Dimensions, TextInput, ScrollView, Platform, Keyboard, NativeSyntheticEvent, NativeScrollEvent, Animated, PanResponder, DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassBackground } from './GlassBackground';
import { FocusMode } from './ModeSelectionOverlay';
import * as haptics from '../utils/haptics';
import { RootStackParamList } from '../App';
import { useSheetAnimation } from '../store/useSheetAnimation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CURATED_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
    'book', 'briefcase', 'fitness', 'barbell', 'library', 'code-slash',
    'laptop', 'moon', 'sunny', 'cafe', 'leaf', 'musical-notes',
    'pencil', 'brush', 'calculator', 'game-controller'
];

const MIN_VALUE = 1;
const MAX_VALUE = 120;
const TICK_COUNT = MAX_VALUE - MIN_VALUE + 1; // 120
const TICK_WIDTH = 14; // spacing between each tick center
const TICK_MARK_WIDTH = 6; // visual width of the tick bar
const INDICATOR_WIDTH = 8; // visual width of the red indicator
const RULER_CONTAINER_HEIGHT = 80;
// Container width = sheet padding area
const RULER_WIDTH = SCREEN_WIDTH - 64; // 8 margin * 2 + 24 padding * 2
// Spacer so tick #1 center aligns with the ruler center when scrolled to 0
const SPACER_WIDTH = (RULER_WIDTH - TICK_WIDTH) / 2;

/** Convert a scroll offset to a tick value (1-120) */
const offsetToValue = (x: number): number => {
    const raw = Math.round(x / TICK_WIDTH) + MIN_VALUE;
    return Math.max(MIN_VALUE, Math.min(MAX_VALUE, raw));
};

/** Convert a tick value (1-120) to the scroll offset that centers it */
const valueToOffset = (v: number): number => {
    return (v - MIN_VALUE) * TICK_WIDTH;
};

const RulerTicks = React.memo(() => {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: RULER_CONTAINER_HEIGHT, paddingBottom: 6 }}>
            <View style={{ width: SPACER_WIDTH }} />
            {Array.from({ length: TICK_COUNT }).map((_, i) => {
                const value = i + MIN_VALUE;
                const isMajor = value % 5 === 0;
                const isTen = value % 10 === 0;
                return (
                    <View key={i} style={{ width: TICK_WIDTH, alignItems: 'center', justifyContent: 'flex-end', height: 60 }}>
                        {isTen && (
                            <Text
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    color: 'rgba(255,255,255,0.75)',
                                    fontSize: 16,
                                    fontFamily: 'SF-Pro-Rounded-Bold',
                                    includeFontPadding: false,
                                    textAlignVertical: 'center',
                                    lineHeight: 18,
                                    width: 40,
                                    textAlign: 'center',
                                    alignSelf: 'center',
                                }}
                            >
                                {value}
                            </Text>
                        )}
                        <View
                            style={{
                                width: TICK_MARK_WIDTH,
                                height: isMajor ? 22 : 12,
                                backgroundColor: isMajor ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                                borderRadius: TICK_MARK_WIDTH / 2,
                            }}
                        />
                    </View>
                );
            })}
            <View style={{ width: SPACER_WIDTH }} />
        </View>
    );
});

type Props = NativeStackScreenProps<RootStackParamList, 'NewModeSheet'>;

export const NewModeSheet: React.FC<Props> = ({ route, navigation }) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTickRef = useRef<number>(25);

    const [name, setName] = useState('');
    const [duration, setDuration] = useState(25);
    const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>(CURATED_ICONS[0]);

    // Debounced scroll handler: update duration after scrolling settles
    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = e.nativeEvent.contentOffset.x;
        const val = offsetToValue(x);

        // Fire haptic when crossing a new tick
        if (val !== lastTickRef.current) {
            lastTickRef.current = val;
            haptics.selection();
        }

        // Clear any pending timer
        if (scrollTimer.current) clearTimeout(scrollTimer.current);
        // Set duration after a short debounce so we don't re-render every frame
        scrollTimer.current = setTimeout(() => {
            setDuration(val);
        }, 30);
    }, []);

    const { fadeAnim, slideAnim, panResponder, closeWithAnimation } = useSheetAnimation(
        () => navigation.goBack()
    );

    useEffect(() => {
        // Scroll to default after layout
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ x: valueToOffset(25), animated: false });
        }, 50);
    }, []);

    const handleCreate = () => {
        if (!name.trim()) return;
        haptics.notifySuccess();

        closeWithAnimation(() => {
            DeviceEventEmitter.emit('createMode', { name: name.trim(), duration, icon: selectedIcon });
            navigation.goBack();
        });
    };

    const handleClose = () => {
        closeWithAnimation(() => navigation.goBack());
    };

    const isCreateDisabled = !name.trim();

    const sheetContent = (
        <>
            <View style={styles.grabber} />
            <View style={styles.sheetHeader}>
                <TouchableOpacity style={styles.closeButton} onPress={handleClose} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                    <Ionicons name="close" size={24} color="#ffffff" style={{ opacity: 0.8 }} />
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>New Focus Mode</Text>
                <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: isCreateDisabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }]}
                    onPress={handleCreate}
                    disabled={isCreateDisabled}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <Ionicons name="checkmark" size={24} color={isCreateDisabled ? "rgba(255,255,255,0.3)" : "#ffffff"} />
                </TouchableOpacity>
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.sectionLabel}>Name</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Coding"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={name}
                    onChangeText={setName}
                    maxLength={15}
                    returnKeyType="done"
                />
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.sectionLabel}>Duration</Text>
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: '#ffffff', fontSize: 28, fontFamily: 'SF-Pro-Rounded-Bold' }}>{duration} min</Text>
                </View>
                <View style={styles.rulerContainer}>
                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={TICK_WIDTH}
                        decelerationRate="fast"
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        <RulerTicks />
                    </ScrollView>
                    {/* Red center indicator — same width as tick marks, perfectly centered */}
                    <View style={styles.centerIndicator} pointerEvents="none" />
                </View>
            </View>

            <View style={styles.iconSection}>
                <Text style={styles.sectionLabel}>Icon</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconScroll}>
                    {CURATED_ICONS.map(icon => (
                        <TouchableOpacity
                            key={icon}
                            style={[styles.iconBox, selectedIcon === icon && styles.iconBoxSelected]}
                            onPress={() => { haptics.selection(); setSelectedIcon(icon); }}
                        >
                            <Ionicons name={icon} size={28} color={selectedIcon === icon ? "#000" : "#fff"} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </>
    );

    return (
        <View style={styles.keyboardAvoid}>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
                    <GlassBackground
                        style={StyleSheet.absoluteFill}
                        glassStyle="regular"
                        tint="dark"
                        intensity={10}
                        fallbackColor="rgba(0, 0, 0, 0.3)"
                    />
                </Pressable>
            </Animated.View>

            <Animated.View {...panResponder.panHandlers} style={{ transform: [{ translateY: slideAnim }] }}>
                <GlassBackground
                    style={styles.sheetContainer}
                    glassStyle="regular"
                    tint="dark"
                    intensity={95}
                    fallbackColor="rgba(30,30,35,0.95)"
                >
                    {sheetContent}
                </GlassBackground>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    keyboardAvoid: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        marginHorizontal: 8,
        marginBottom: 32, // Floating padding from bottom
        borderRadius: 32,
        // @ts-ignore
        cornerCurve: 'continuous',
        padding: 24,
        paddingTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 20,
        overflow: 'hidden',
    },
    grabber: {
        width: 36,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 16,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheetTitle: {
        flex: 1,
        color: '#ffffff',
        fontSize: 24,
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
        marginBottom: 8,
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
    rulerContainer: {
        height: RULER_CONTAINER_HEIGHT,
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    centerIndicator: {
        position: 'absolute',
        top: 36,
        bottom: 4,
        left: '50%',
        marginLeft: -(INDICATOR_WIDTH / 2),
        width: INDICATOR_WIDTH,
        backgroundColor: '#FF453A',
        borderRadius: INDICATOR_WIDTH / 2,
        zIndex: 10,
    },
    iconSection: {
        marginBottom: 16,
    },
    iconScroll: {
        paddingRight: 20,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconBoxSelected: {
        backgroundColor: '#ffffff',
    },
});
