import React, { useRef, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Animated, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import * as haptics from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MIN_VALUE = 1;
const MAX_VALUE = 120;
const TICK_COUNT = MAX_VALUE - MIN_VALUE + 1;
const TICK_WIDTH = 16;
const TICK_MARK_WIDTH = 7;
const INDICATOR_WIDTH = 11;

/** Convert a scroll offset to a tick value, snapped to the nearest multiple of 5 */
const offsetToValue = (x: number): number => {
    const exactValue = (x / TICK_WIDTH) + MIN_VALUE;
    const snappedValue = Math.round(exactValue / 5) * 5;
    return Math.max(5, Math.min(MAX_VALUE, snappedValue));
};

/** Convert a tick value to the scroll offset that centers it */
export const valueToOffset = (v: number): number => {
    return (v - MIN_VALUE) * TICK_WIDTH;
};

interface RulerPickerProps {
    containerWidth: number;
    initialValue: number;
    onValueChange: (value: number) => void;
    height?: number;
}

/** Individual animated number label that responds to scroll position */
const AnimatedNumberLabel = React.memo(({
    value,
    scrollX,
    spacerWidth,
}: {
    value: number;
    scrollX: Animated.Value;
    spacerWidth: number;
}) => {
    // The pixel position of this tick's center relative to the scroll content
    const tickOffset = (value - MIN_VALUE) * TICK_WIDTH;

    // Distance from the center indicator (0 = perfectly centered)
    // When scrollX = tickOffset, this number is under the red indicator
    const distanceFromCenter = Animated.subtract(scrollX, tickOffset);

    // Interpolate scale: bigger when centered, normal when far
    const scale = distanceFromCenter.interpolate({
        inputRange: [-TICK_WIDTH * 5, 0, TICK_WIDTH * 5],
        outputRange: [1, 2, 1],
        extrapolate: 'clamp',
    });

    // Interpolate opacity: bright white when centered, dim when far
    const opacity = distanceFromCenter.interpolate({
        inputRange: [-TICK_WIDTH * 5, 0, TICK_WIDTH * 5],
        outputRange: [0.3, 1, 0.3],
        extrapolate: 'clamp',
    });

    return (
        <Animated.Text
            style={{
                position: 'absolute',
                top: 10,
                color: '#ffffff',
                fontSize: 24,
                fontFamily: 'SF-Pro-Rounded-Bold',
                includeFontPadding: false,
                textAlignVertical: 'center',
                lineHeight: 26,
                width: 70,
                textAlign: 'center',
                alignSelf: 'center',
                opacity,
                transform: [{ scale }],
            }}
        >
            {value}
        </Animated.Text>
    );
});

/** All ruler ticks, with animated numbers */
const RulerTicks = React.memo(({
    spacerWidth,
    scrollX,
}: {
    spacerWidth: number;
    scrollX: Animated.Value;
}) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 130, paddingBottom: 10 }}>
        <View style={{ width: spacerWidth }} />
        {Array.from({ length: TICK_COUNT }).map((_, i) => {
            const value = i + MIN_VALUE;
            return (
                <RulerTick
                    key={i}
                    value={value}
                    scrollX={scrollX}
                    spacerWidth={spacerWidth}
                />
            );
        })}
        <View style={{ width: spacerWidth }} />
    </View>
));

const RulerTick = React.memo(({
    value,
    scrollX,
    spacerWidth,
}: {
    value: number;
    scrollX: Animated.Value;
    spacerWidth: number;
}) => {
    const isMajor = value % 5 === 0;

    return (
        <View style={{ width: TICK_WIDTH, alignItems: 'center', justifyContent: 'flex-end', height: 120, overflow: 'visible' }}>
            {isMajor && (
                <AnimatedNumberLabel
                    value={value}
                    scrollX={scrollX}
                    spacerWidth={spacerWidth}
                />
            )}
            <View
                style={{
                    width: TICK_MARK_WIDTH,
                    height: isMajor ? 64 : 30,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: TICK_MARK_WIDTH / 2,
                }}
            />
        </View>
    );
});

export const RulerPicker: React.FC<RulerPickerProps> = ({ containerWidth, initialValue, onValueChange, height = 120 }) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const lastTickRef = useRef<number>(initialValue);
    const lastHapticTickRef = useRef<number>(initialValue);
    const hasScrolledInitial = useRef(false);

    // Animated value tracking the scroll position for smooth number animations
    const scrollX = useRef(new Animated.Value(valueToOffset(initialValue))).current;

    const spacerWidth = (containerWidth - TICK_WIDTH) / 2;

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = e.nativeEvent.contentOffset.x;

        // Calculate the exact tick the indicator is currently over (1, 2, 3...)
        const exactValue = Math.round((x / TICK_WIDTH) + MIN_VALUE);
        const clampedExactValue = Math.max(MIN_VALUE, Math.min(MAX_VALUE, exactValue));

        // Fire haptics on every single tick line
        if (clampedExactValue !== lastHapticTickRef.current) {
            lastHapticTickRef.current = clampedExactValue;
            haptics.impactLight();
        }

        // Calculate the snapped value (multiples of 5) for timer updates
        const val = offsetToValue(x);

        if (val !== lastTickRef.current) {
            lastTickRef.current = val;
            onValueChange(val);
        }
    }, [onValueChange]);

    const handleLayout = useCallback(() => {
        if (!hasScrolledInitial.current) {
            hasScrolledInitial.current = true;
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({ x: valueToOffset(initialValue), animated: false });
            }, 50);
        }
    }, [initialValue]);

    // Calculate exact snap offsets for multiples of 5 (5, 10, 15... 120)
    const snapOffsets = useRef(
        Array.from({ length: Math.floor(MAX_VALUE / 5) }).map((_, i) => {
            const val = (i + 1) * 5;
            return valueToOffset(val);
        })
    ).current;

    return (
        <View style={[styles.container, { height }]}>
            <Animated.ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToOffsets={snapOffsets}
                snapToAlignment="center"
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    {
                        useNativeDriver: true,
                        listener: handleScroll,
                    }
                )}
                scrollEventThrottle={16}
                onLayout={handleLayout}
            >
                <RulerTicks spacerWidth={spacerWidth} scrollX={scrollX} />
            </Animated.ScrollView>
            <View style={styles.centerIndicator} pointerEvents="none" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        backgroundColor: 'transparent',
        overflow: 'visible',
    },
    centerIndicator: {
        position: 'absolute',
        top: 56,
        bottom: 0,
        left: '50%',
        marginLeft: -(INDICATOR_WIDTH / 2),
        width: INDICATOR_WIDTH,
        backgroundColor: '#FF453A',
        borderRadius: INDICATOR_WIDTH / 2,
        zIndex: 10,
    },
});
