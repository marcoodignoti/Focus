import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import * as haptics from '../utils/haptics';

export const useFocusAnimations = (isActive: boolean, stopFocusCallback: () => void) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const progressBarOpacityAnim = useRef(new Animated.Value(0)).current;
    const holdAnim = useRef<Animated.CompositeAnimation | null>(null);

    const startFocusAnimation = useCallback(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    const stopFocusAnimation = useCallback(() => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
        }).start();
        progressAnim.setValue(0);
    }, [fadeAnim, progressAnim]);

    const handlePressIn = useCallback(() => {
        if (!isActive) return;

        Animated.timing(progressBarOpacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        holdAnim.current = Animated.timing(progressAnim, {
            toValue: 1,
            duration: 5000, // Hold for 5 seconds to stop
            useNativeDriver: false, // width interpolation doesn't support native driver
        });

        holdAnim.current.start(({ finished }) => {
            if (finished) {
                haptics.notifyWarning();
                stopFocusCallback();
                progressBarOpacityAnim.setValue(0);
            }
        });
    }, [isActive, progressAnim, progressBarOpacityAnim, stopFocusCallback]);

    const handlePressOut = useCallback(() => {
        if (!isActive) return;
        if (holdAnim.current) {
            holdAnim.current.stop();
        }

        Animated.timing(progressBarOpacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();

        Animated.timing(progressAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isActive, progressAnim, progressBarOpacityAnim]);

    const widthInterpolation = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const invertedFadeAnim = fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0]
    });

    return {
        fadeAnim,
        invertedFadeAnim,
        progressBarOpacityAnim,
        widthInterpolation,
        startFocusAnimation,
        stopFocusAnimation,
        handlePressIn,
        handlePressOut,
    };
};
