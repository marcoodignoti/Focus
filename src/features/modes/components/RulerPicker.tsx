import React from 'react';
import { StyleSheet, View, Dimensions, ListRenderItemInfo } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolate,
    SharedValue,
    runOnJS
} from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import * as haptics from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MIN_VALUE = 1;
const MAX_VALUE = 120;
const TICK_WIDTH = 16;
const TICK_MARK_WIDTH = 7;
const INDICATOR_WIDTH = 11;

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList) as any;

const offsetToValue = (x: number): number => {
    'worklet';
    const exactValue = (x / TICK_WIDTH) + MIN_VALUE;
    const roundedValue = Math.round(exactValue);
    return Math.max(MIN_VALUE, Math.min(MAX_VALUE, roundedValue));
};

export const valueToOffset = (v: number): number => {
    'worklet';
    return (v - MIN_VALUE) * TICK_WIDTH;
};

const RULER_DATA = Array.from({ length: MAX_VALUE - MIN_VALUE + 1 }, (_, i) => i + MIN_VALUE);

const AnimatedNumberLabel = React.memo(function AnimatedNumberLabel({
    value,
    scrollX,
}: {
    value: number;
    scrollX: SharedValue<number>;
}) {
    const tickOffset = (value - MIN_VALUE) * TICK_WIDTH;

    // Animazione dell'etichetta numerica (Tutto sul UI Thread)
    const animatedStyle = useAnimatedStyle(() => {
        const distance = Math.abs(scrollX.value - tickOffset);

        // Ottimizzazione: non calcoliamo nulla se l'elemento è troppo lontano dal centro
        if (distance > TICK_WIDTH * 10) {
            return { opacity: 0, transform: [{ scale: 1 }] };
        }

        const scale = interpolate(
            scrollX.value,
            [tickOffset - TICK_WIDTH * 5, tickOffset, tickOffset + TICK_WIDTH * 5],
            [1, 2, 1],
            Extrapolate.CLAMP
        );

        const opacity = interpolate(
            scrollX.value,
            [tickOffset - TICK_WIDTH * 5, tickOffset, tickOffset + TICK_WIDTH * 5],
            [0.3, 1, 0.3],
            Extrapolate.CLAMP
        );

        return {
            opacity,
            transform: [{ scale }],
        };
    });

    return (
        <Animated.Text
            style={[
                styles.labelText,
                animatedStyle,
            ]}
        >
            {value}
        </Animated.Text>
    );
});

const RulerTick = React.memo(function RulerTick({
    value,
    scrollX,
}: {
    value: number;
    scrollX: SharedValue<number>;
}) {
    const isMajor = value % 5 === 0;
    const tickOffset = (value - MIN_VALUE) * TICK_WIDTH;

    const baseOpacityStyle = useAnimatedStyle(() => {
        const distance = Math.abs(scrollX.value - tickOffset);
        const opacity = interpolate(
            distance,
            [0, TICK_WIDTH * 3],
            [1, 0.15],
            Extrapolate.CLAMP
        );
        return { opacity };
    });

    return (
        <View style={styles.tickContainer}>
            {isMajor ? (
                <AnimatedNumberLabel
                    value={value}
                    scrollX={scrollX}
                />
            ) : null}
            <View style={[styles.tickMarkWrapper, { height: isMajor ? 64 : 30 }]}>
                <Animated.View
                    style={[
                        styles.tickMark,
                        styles.tickMarkBase,
                        baseOpacityStyle
                    ]}
                />
            </View>
        </View>
    );
});

interface RulerPickerProps {
    containerWidth: number;
    initialValue: number;
    sharedValue: SharedValue<number>;
    height?: number;
}

const keyExtractor = (item: any) => item.toString();

export function RulerPicker({ containerWidth, initialValue, sharedValue, height = 120 }: RulerPickerProps) {
    const lastHapticValue = useSharedValue(initialValue);
    const scrollX = useSharedValue(valueToOffset(initialValue));
    const spacerWidth = (containerWidth - TICK_WIDTH) / 2;

    const snapOffsets = React.useMemo(() => {
        const offsets: number[] = [];
        for (let i = MIN_VALUE; i <= MAX_VALUE; i++) {
            if (i % 5 === 0) {
                offsets.push(valueToOffset(i));
            }
        }
        return offsets;
    }, []);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            'worklet';
            const x = event.contentOffset.x;
            scrollX.value = x;

            const currentVal = offsetToValue(x);
            sharedValue.value = currentVal;

            // Logica aptica spostata sul UI Thread per massima precisione
            if (currentVal !== lastHapticValue.value) {
                lastHapticValue.value = currentVal;
                // Eseguiamo l'aptica solo per i multipli di 5 o 1
                if (currentVal % 5 === 0) {
                    runOnJS(haptics.selection)();
                }
            }
        },
    });

    const renderItem = ({ item }: any) => (
        <RulerTick value={item} scrollX={scrollX} />
    );

    return (
        <View style={[styles.container, { height, width: containerWidth }]}>
            <AnimatedFlashList
                data={RULER_DATA}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: valueToOffset(initialValue), y: 0 }}
                estimatedItemSize={TICK_WIDTH}
                snapToOffsets={snapOffsets}
                decelerationRate="fast"
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingHorizontal: spacerWidth }}
                removeClippedSubviews={true}
            />
            <View style={[styles.centerIndicator, { left: (containerWidth - INDICATOR_WIDTH) / 2 }]} pointerEvents="none" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignSelf: 'center',
        backgroundColor: 'transparent',
    },
    tickContainer: {
        width: TICK_WIDTH,
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 120,
    },
    tickMarkWrapper: {
        width: TICK_MARK_WIDTH,
        position: 'relative',
    },
    tickMark: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: TICK_MARK_WIDTH / 2,
    },
    tickMarkBase: {
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    labelText: {
        position: 'absolute',
        top: 10,
        color: '#ffffff',
        fontSize: 24,
        fontFamily: 'SF-Pro-Rounded-Bold',
        textAlign: 'center',
        width: 70,
    },
    centerIndicator: {
        position: 'absolute',
        top: 56,
        bottom: 0,
        width: INDICATOR_WIDTH,
        backgroundColor: '#FF453A',
        borderRadius: INDICATOR_WIDTH / 2,
        zIndex: 10,
        opacity: 1,
    },
});
