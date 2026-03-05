import { useEffect, useState, useCallback } from 'react';
import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Apple-like spring configs — snappy, responsive, minimal bounce
const OPEN_SPRING = { damping: 32, stiffness: 350, mass: 0.8 };
const CLOSE_SPRING = { damping: 28, stiffness: 300, mass: 0.8 };
const SNAP_BACK_SPRING = { damping: 22, stiffness: 400 };

// Gesture thresholds
const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 800;

// Rubber-band factor (lower = more resistance)
const RUBBER_BAND_FACTOR = 0.35;

interface SheetAnimationResult {
    gesture: any;
    closeWithAnimation: () => void;
    animatedSheetStyle: any;
    animatedBackdropStyle: any;
    /** True once the open animation has settled — use to defer heavy content */
    isReady: boolean;
}

export const useSheetAnimation = (onClose: () => void, onOpenComplete?: () => void): SheetAnimationResult => {
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const [isReady, setIsReady] = useState(false);

    const markReady = useCallback(() => {
        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(() => {
                setIsReady(true);
                onOpenComplete?.();
            });
        } else {
            setTimeout(() => {
                setIsReady(true);
                onOpenComplete?.();
            }, 0);
        }
    }, [onOpenComplete]);

    // Open animation — snappy spring, all on UI thread
    useEffect(() => {
        translateY.value = withSpring(0, OPEN_SPRING, (finished) => {
            if (finished) {
                runOnJS(markReady)();
            }
        });
    }, []);

    // Close — spring-driven for natural feel (not withTiming)
    const closeSheet = useCallback(() => {
        translateY.value = withSpring(SCREEN_HEIGHT, CLOSE_SPRING, (finished) => {
            if (finished) {
                runOnJS(onClose)();
            }
        });
    }, [onClose]);

    const gesture = Gesture.Pan()
        .activeOffsetY(5) // Respond quickly to downward pulls
        .failOffsetY(-5) // Fail on upward scroll
        .onUpdate((event) => {
            'worklet';
            if (event.translationY > 0) {
                // Rubber-band effect for natural resistance
                translateY.value = event.translationY;
            } else {
                // Rubber-band resistance when pulling up past origin
                translateY.value = event.translationY * RUBBER_BAND_FACTOR;
            }
        })
        .onEnd((event) => {
            'worklet';
            if (event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
                // Dismiss — use velocity-aware spring for momentum feel
                translateY.value = withSpring(SCREEN_HEIGHT, {
                    ...CLOSE_SPRING,
                    velocity: event.velocityY,
                }, (finished) => {
                    if (finished) {
                        runOnJS(onClose)();
                    }
                });
            } else {
                // Snap back
                translateY.value = withSpring(0, SNAP_BACK_SPRING);
            }
        });

    const animatedSheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    // Backdrop opacity driven from translateY — no separate shared value needed.
    // Fully opaque at translateY=0, transparent at SCREEN_HEIGHT.
    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateY.value,
            [0, SCREEN_HEIGHT],
            [1, 0],
            Extrapolation.CLAMP,
        ),
    }));

    return { gesture, closeWithAnimation: closeSheet, animatedSheetStyle, animatedBackdropStyle, isReady };
};
