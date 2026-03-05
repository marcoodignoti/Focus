import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Pressable, Text, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    useAnimatedReaction,
    runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { canUseGlass } from '@/lib/glassCapability';
import { RulerPicker } from './RulerPicker';
import * as haptics from '@/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RulerOverlayProps {
    visible: boolean;
    onClose: () => void;
    initialValue: number;
    onValueChange: (value: number) => void;
}



export const RulerOverlay: React.FC<RulerOverlayProps> = ({
    visible,
    onClose,
    initialValue,
    onValueChange,
}) => {
    const insets = useSafeAreaInsets();

    // Shared values for UI Thread animations
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const sharedValue = useSharedValue(initialValue);

    const [shouldRender, setShouldRender] = useState(visible);

    // Ref to mirror sharedValue on JS thread without reading .value during render
    const sharedValueRef = useRef(initialValue);

    const syncSharedValueRef = (v: number) => {
        sharedValueRef.current = v;
    };

    // Keep the ref in sync via UI thread reaction
    useAnimatedReaction(
        () => sharedValue.value,
        (current) => {
            runOnJS(syncSharedValueRef)(current);
        }
    );

    const initialValueRef = useRef(initialValue);
    useEffect(() => {
        initialValueRef.current = initialValue;
    }, [initialValue]);

    const handleClose = () => {
        'worklet';
        opacity.value = withTiming(0, { duration: 250 });
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, (finished) => {
            if (finished) {
                runOnJS(setShouldRender)(false);
                runOnJS(onClose)();
            }
        });
    };

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            sharedValue.value = initialValueRef.current;

            opacity.value = withTiming(1, { duration: 300 });
            translateY.value = withSpring(0, {
                damping: 20,
                stiffness: 90,
                mass: 1,
            });
        } else {
            handleClose();
        }
    }, [visible]);

    const gesture = Gesture.Pan()
        .activeOffsetY([0, 10])
        .onUpdate((event) => {
            if (event.translationY > 0) {
                translateY.value = event.translationY;
            }
        })
        .onEnd((event) => {
            if (event.translationY > 100 || event.velocityY > 500) {
                handleClose();
            } else {
                translateY.value = withSpring(0, {
                    damping: 15,
                    stiffness: 100,
                });
            }
        });



    const animatedSheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    if (!shouldRender) return null;

    const useGlass = canUseGlass();

    const content = (
        <View style={[styles.contentContainer, !useGlass && { flex: 0, paddingBottom: 24 }]}>
            {/* Grabber */}
            <View style={styles.grabberContainer}>
                <View style={styles.grabber} />
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Adjust duration</Text>
                </View>

                <View style={styles.rulerWrapper}>
                    <RulerPicker
                        key={initialValue}
                        containerWidth={SCREEN_WIDTH - 64}
                        initialValue={initialValue}
                        sharedValue={sharedValue}
                        height={100}
                    />
                </View>

                <View style={styles.bottomContainer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.doneButton,
                            { opacity: pressed ? 0.8 : 1 }
                        ]}
                        onPress={() => {
                            haptics.impactMedium();
                            onValueChange(Math.round(sharedValueRef.current));
                            onClose();
                        }}
                    >
                        <Text style={styles.doneButtonText}>Set Time</Text>
                    </Pressable>
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

        if (Platform.OS === 'ios') {
            return (
                <View style={[styles.sheetContainer, { flex: 0 }]}>
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    {content}
                </View>
            );
        }

        return (
            <View style={[styles.sheetContainer, styles.fallbackContainer, { flex: 0 }]}>
                {content}
            </View>
        );
    };

    return (
        <View style={styles.root} pointerEvents={visible ? 'auto' : 'none'}>
            {/* Backdrop */}
            <Animated.View style={[StyleSheet.absoluteFill, animatedBackdropStyle]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
                </Pressable>
            </Animated.View>

            {/* Detached Sheet */}
            <GestureDetector gesture={gesture}>
                <Animated.View style={[
                    styles.sheetWrapper,
                    animatedSheetStyle,
                    {
                        paddingHorizontal: 8,
                        paddingBottom: Platform.OS === 'ios' ? 8 : 24,
                        justifyContent: 'flex-end'
                    }
                ]}>
                    {renderContainer()}
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 200,
        justifyContent: 'flex-end',
    },
    sheetWrapper: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    sheetContainer: {
        width: '100%',
        borderRadius: 32,
        overflow: 'hidden',
    },
    fallbackContainer: {
        backgroundColor: 'rgba(40, 40, 40, 0.85)',
    },
    contentContainer: {
        width: '100%',
    },
    grabberContainer: {
        width: '100%',
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    grabber: {
        width: 36,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 32,
    },
    header: {
        alignItems: 'center',
        marginTop: 8,
    },
    title: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontFamily: 'SF-Pro-Rounded-Semibold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    rulerWrapper: {
        height: 120,
        width: '100%',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        overflow: 'hidden',
    },
    bottomContainer: {
        width: '100%',
        alignItems: 'center',
    },
    doneButton: {
        width: '100%',
        height: 64,
        borderRadius: 32,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#1E1F24',
        fontSize: 18,
        fontFamily: 'SF-Pro-Rounded-Bold',
    }
});
