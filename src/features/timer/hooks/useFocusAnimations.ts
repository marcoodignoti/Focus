import { useSharedValue, withTiming, runOnJS, useDerivedValue, cancelAnimation, Easing } from 'react-native-reanimated';
import * as haptics from '@/utils/haptics';

export const useFocusAnimations = (isActive: boolean, stopFocusCallback: () => void) => {
    const fadeAnim = useSharedValue(0);
    const progressAnim = useSharedValue(0);
    const progressBarOpacityAnim = useSharedValue(0);

    const startFocusAnimation = () => {
        fadeAnim.value = withTiming(1, { duration: 500 });
    };

    const stopFocusAnimation = () => {
        fadeAnim.value = withTiming(0, { duration: 500 });
        progressAnim.value = 0;
    };

    const handlePressIn = () => {
        if (!isActive) return;

        progressBarOpacityAnim.value = withTiming(1, { duration: 300 });

        // Animazione del progresso gestita nativamente
        progressAnim.value = withTiming(1, {
            duration: 3000, // Ridotto a 3 secondi per test, puoi ripristinare 5000
            easing: Easing.linear
        }, (finished) => {
            if (finished) {
                runOnJS(haptics.notifyWarning)();
                runOnJS(stopFocusCallback)();
                progressBarOpacityAnim.value = withTiming(0, { duration: 0 });
            }
        });
    };

    const handlePressOut = () => {
        if (!isActive) return;

        cancelAnimation(progressAnim);

        progressBarOpacityAnim.value = withTiming(0, { duration: 300 });
        progressAnim.value = withTiming(0, { duration: 300 });
    };

    return {
        fadeAnim,
        progressBarOpacityAnim,
        progressScaleX: progressAnim,
        startFocusAnimation,
        stopFocusAnimation,
        handlePressIn,
        handlePressOut,
    };
};
