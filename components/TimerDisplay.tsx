import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, ViewStyle } from 'react-native';

const DIGIT_HEIGHT = 100; // Match fontSize approximately + padding

interface AnimatedDigitProps {
    digit: string;
}

const AnimatedDigit: React.FC<AnimatedDigitProps> = ({ digit }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const numericDigit = parseInt(digit, 10);

    useEffect(() => {
        Animated.spring(animatedValue, {
            toValue: -numericDigit * DIGIT_HEIGHT,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
        }).start();
    }, [numericDigit]);

    return (
        <View style={styles.digitContainer}>
            <Animated.View style={[styles.digitColumn, { transform: [{ translateY: animatedValue }] }]}>
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
    durationInMinutes: number;
    isActive: boolean;
    onComplete: () => void;
    style?: ViewStyle;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ durationInMinutes, isActive, onComplete, style }) => {
    const [timeLeft, setTimeLeft] = useState(durationInMinutes * 60);

    useEffect(() => {
        setTimeLeft(durationInMinutes * 60);
    }, [durationInMinutes]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            onComplete();
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, onComplete]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');

    return (
        <View style={[styles.container, style]}>
            {minutesStr.split('').map((digit, idx) => (
                <AnimatedDigit key={`min-${minutesStr.length - idx}`} digit={digit} />
            ))}
            <Text style={styles.text}>:</Text>
            {secondsStr.split('').map((digit, idx) => (
                <AnimatedDigit key={`sec-${secondsStr.length - idx}`} digit={digit} />
            ))}
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
        width: 55, // Fixed width for each digit to prevent jumping
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
