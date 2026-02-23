import { useRef, useEffect } from 'react';
import { Animated, Dimensions, PanResponder, PanResponderInstance } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface SheetAnimationResult {
    fadeAnim: Animated.Value;
    slideAnim: Animated.Value;
    panResponder: PanResponderInstance;
    closeWithAnimation: (callback: () => void) => void;
}

/**
 * Shared animation logic for bottom-sheet components (NewModeSheet, RenameSheet).
 * Handles fade-in/slide-up entrance, swipe-to-dismiss gesture, and animated exit.
 */
export const useSheetAnimation = (onClose: () => void): SheetAnimationResult => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 50, useNativeDriver: true }),
        ]).start();
    }, []);

    const closeWithAnimation = (callback: () => void) => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
        ]).start(() => {
            callback();
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 15 && gestureState.vy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    slideAnim.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 120 || gestureState.vy > 1.5) {
                    closeWithAnimation(onClose);
                } else {
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        friction: 9,
                        tension: 50,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    return { fadeAnim, slideAnim, panResponder, closeWithAnimation };
};
