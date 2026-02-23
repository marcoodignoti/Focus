import React, { useRef } from 'react';
import { StyleSheet, Text, View, ViewStyle, Animated, Pressable } from 'react-native';
import { GlassBackground } from './GlassBackground';
import * as haptics from '../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StartButtonProps {
    label: string;
    onPress: () => void;
    style?: ViewStyle;
}

export const StartButton: React.FC<StartButtonProps> = ({ label, onPress, style }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        haptics.impactLight();
        Animated.spring(scaleAnim, {
            toValue: 0.85,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 40,
        }).start();
    };

    const content = (
        <View style={styles.innerContainer}>
            <Text style={styles.text}>{label}</Text>
        </View>
    );

    return (
        <AnimatedPressable
            style={[styles.button, style, { transform: [{ scale: scaleAnim }] }]}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <GlassBackground
                style={[StyleSheet.absoluteFill, { margin: -2 }]}
                glassStyle="clear"
                tintColor="transparent"
                tint="light"
                intensity={20}
                fallbackColor="rgba(255, 255, 255, 0.2)"
            />
            {content}
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 50, // Pill shape
        // @ts-ignore: cornerCurve is a valid iOS prop since RN 0.73
        cornerCurve: 'continuous',
        overflow: 'hidden',
    },
    innerContainer: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#ffffff',
        fontSize: 20,
        fontFamily: 'SF-Pro-Rounded-Semibold',
    },
});
