import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    Easing, 
    useAnimatedReaction, 
    runOnJS,
    cancelAnimation,
    useDerivedValue,
    SharedValue
} from 'react-native-reanimated';

const DIGIT_HEIGHT = 100;

interface AnimatedDigitProps {
    digitValue: SharedValue<number>;
}

const AnimatedDigit: React.FC<AnimatedDigitProps> = ({ digitValue }) => {
    // Drive translateY from a dedicated shared value so we don't call
    // withTiming inside useAnimatedStyle (which re-fires every frame).
    const translateY = useSharedValue(0);

    useAnimatedReaction(
        () => digitValue.value,
        (current, previous) => {
            if (previous === null || previous === undefined) {
                // First run (mount) — snap immediately without animation
                translateY.value = -current * DIGIT_HEIGHT;
            } else if (current !== previous) {
                translateY.value = withTiming(-current * DIGIT_HEIGHT, {
                    duration: 300,
                    easing: Easing.out(Easing.cubic),
                });
            }
        },
        [digitValue]
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <View style={styles.digitContainer}>
            <Animated.View style={[styles.digitColumn, animatedStyle]}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <Text key={n} style={styles.text}>
                        {n}
                    </Text>
                ))}
            </Animated.View>
        </View>
    );
};

interface TimerDisplayProps {
    durationSeconds: number;
    isActive: boolean;
    onComplete: () => void;
    style?: ViewStyle;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ durationSeconds, isActive, onComplete, style }) => {
    // Shared value per il tempo rimanente (UI Thread)
    const timeLeft = useSharedValue(durationSeconds);
    
    // Shared values per le singole cifre
    const min1 = useSharedValue(0);
    const min2 = useSharedValue(0);
    const sec1 = useSharedValue(0);
    const sec2 = useSharedValue(0);

    // Ref to mirror timeLeft on JS thread without reading .value during render
    const timeLeftRef = useRef(durationSeconds);

    const syncTimeLeftRef = (v: number) => {
        timeLeftRef.current = v;
    };

    // Effetto per sincronizzare il tempo iniziale
    useEffect(() => {
        timeLeft.value = durationSeconds;
        timeLeftRef.current = durationSeconds;
    }, [durationSeconds]);

    // Keep the ref in sync via UI thread reaction
    useAnimatedReaction(
        () => timeLeft.value,
        (current) => {
            runOnJS(syncTimeLeftRef)(current);
        }
    );

    // Logica del countdown sul UI Thread
    useEffect(() => {
        if (isActive) {
            // Avviamo un'animazione lineare che riduce timeLeft a 0
            timeLeft.value = withTiming(0, {
                duration: timeLeftRef.current * 1000,
                easing: Easing.linear,
            }, (finished) => {
                if (finished) {
                    runOnJS(onComplete)();
                }
            });
        } else {
            cancelAnimation(timeLeft);
        }
        return () => cancelAnimation(timeLeft);
    }, [isActive, onComplete]);

    // Reazione per scomporre il tempo in cifre (tutto su UI Thread)
    useAnimatedReaction(
        () => timeLeft.value,
        (current) => {
            const total = Math.ceil(current);
            const m = Math.floor(total / 60);
            const s = total % 60;
            
            min1.value = Math.floor(m / 10);
            min2.value = m % 10;
            sec1.value = Math.floor(s / 10);
            sec2.value = s % 10;
        }
    );

    return (
        <View style={[styles.container, style]}>
            <AnimatedDigit digitValue={min1} />
            <AnimatedDigit digitValue={min2} />
            <Text style={styles.text}>:</Text>
            <AnimatedDigit digitValue={sec1} />
            <AnimatedDigit digitValue={sec2} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: DIGIT_HEIGHT,
    },
    digitContainer: {
        height: DIGIT_HEIGHT,
        width: 55,
        overflow: 'hidden',
    },
    digitColumn: {
        alignItems: 'center',
    },
    text: {
        color: '#ffffff',
        fontSize: 90,
        fontFamily: 'SF-Pro-Rounded-Bold',
        includeFontPadding: false,
        height: DIGIT_HEIGHT,
        textAlignVertical: 'center',
        textAlign: 'center',
    },
});
