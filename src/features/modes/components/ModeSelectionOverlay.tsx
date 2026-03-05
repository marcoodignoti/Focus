import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, ScrollView } from 'react-native';
import { GlassContainer } from '@/components/GlassContainer';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay, runOnJS, useDerivedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FocusMode } from '@/lib/types';
import { CURATED_ICONS, getIconColor } from '@/lib/constants';
import * as haptics from '@/utils/haptics';
import { canUseGlass } from '@/lib/glassCapability';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedOverlayItemProps {
    visible: boolean;
    isActive: boolean;
    onPress: () => void;
    children: React.ReactNode;
    expandedContent?: React.ReactNode;
    expanded?: boolean;
    style?: any;
    contentStyle?: any;
    hidden?: boolean;
    glassEffect?: boolean;
    index?: number;
    onCollapseEnd?: () => void;
}

const AnimatedOverlayItem = ({
    visible,
    isActive,
    onPress,
    children,
    expandedContent,
    expanded = false,
    style,
    contentStyle,
    hidden = false,
    glassEffect = true,
    index = 0,
    onCollapseEnd,
}: AnimatedOverlayItemProps) => {
    if (hidden) return null;

    // --- Expand/collapse morphing animation ---
    const expandHeight = useSharedValue(0);
    const measuredHeight = useSharedValue(0);
    const [isMeasured, setIsMeasured] = useState(false);

    useEffect(() => {
        if (expanded) {
            // Only animate if we already know the target height.
            // First open is handled in onExpandedLayout below.
            if (measuredHeight.value > 0) {
                expandHeight.value = withSpring(measuredHeight.value, {
                    damping: 50,
                    stiffness: 120,
                    mass: 1,
                });
            }
        } else {
            expandHeight.value = withSpring(0, {
                damping: 20,
                stiffness: 105,
                mass: 1,
            }, (finished) => {
                if (finished && onCollapseEnd) {
                    runOnJS(onCollapseEnd)();
                }
            });
        }
    }, [expanded]);

    const expandStyle = useAnimatedStyle(() => ({
        height: expandHeight.value,
        opacity: measuredHeight.value > 0
            ? Math.min(1, expandHeight.value / measuredHeight.value)
            : 0,
        overflow: 'hidden' as const,
    }));

    const onExpandedLayout = (e: any) => {
        const h = e.nativeEvent.layout.height;
        if (h > 0 && !isMeasured) {
            measuredHeight.value = h;
            setIsMeasured(true);
            // First open — animate from 0 to measured height
            if (expanded) {
                expandHeight.value = withSpring(h, {
                    damping: 20,
                    stiffness: 100,
                    mass: 1,
                });
            }
        }
    };

    const content = (
        <View style={{ width: '100%' }}>
            <Pressable
                style={({ pressed }) => [{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    height: 68,
                    opacity: pressed ? 0.7 : 1,
                }, contentStyle]}
                onPress={onPress}
            >
                {children}
            </Pressable>
            {expandedContent ? (
                <>
                    {/* Hidden measurer — renders off-screen to get content height */}
                    {!isMeasured && (
                        <View
                            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                            onLayout={onExpandedLayout}
                        >
                            {expandedContent}
                        </View>
                    )}
                    {/* Animated clip container */}
                    <Animated.View style={expandStyle}>
                        {expandedContent}
                    </Animated.View>
                </>
            ) : null}
        </View>
    );

    const itemOpacity = useSharedValue(0);
    const itemTranslateY = useSharedValue(20);

    useEffect(() => {
        itemOpacity.value = withDelay(index * 60, withTiming(1, { duration: 300 }));
        itemTranslateY.value = withDelay(index * 60, withSpring(0, { damping: 90 }));
    }, []);

    // IMPORTANT: Never apply opacity to a parent of GlassView!
    // iOS 26 bug: opacity 0 on any ancestor permanently breaks the glass effect.
    const slideStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: itemTranslateY.value }],
    }));

    const fadeStyle = useAnimatedStyle(() => ({
        opacity: itemOpacity.value,
    }));

    if (!glassEffect) {
        return (
            <Animated.View style={[{ marginBottom: 14 }, slideStyle, fadeStyle, style]}>
                {content}
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[{ marginBottom: 14 }, slideStyle, style]}>
            <GlassContainer
                key={`${isActive}`}
                borderRadius={34}
                intensity={isActive ? 40 : 20}
                tint={isActive ? 'light' : 'dark'}
                style={{ backgroundColor: 'transparent' }}
                glassStyle={isActive ? 'regular' : 'clear'}
                tintColor={isActive ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                isInteractive={true}
                gradientColor={isActive ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)'}
                gradientExtension={isActive ? 0.85 : 0}
                borderWidth={isActive ? 1.5 : 1}
            >
                <Animated.View style={[fadeStyle, { width: '100%' }]}>
                    {content}
                </Animated.View>
            </GlassContainer>
        </Animated.View>
    );
};

interface ModeExpandedContentProps {
    mode: FocusMode;
    isActive: boolean;
    isDefault: boolean;
    isIconPickerOpen: boolean;
    onRename: () => void;
    onToggleIconPicker: () => void;
    onUpdateIcon?: (id: string, newIcon: keyof typeof Ionicons.glyphMap) => void;
    onSetDefault: () => void;
    onDelete: () => void;
}

const ModeExpandedContent = React.memo(function ModeExpandedContent({
    mode, isActive, isDefault, isIconPickerOpen,
    onRename, onToggleIconPicker, onUpdateIcon, onSetDefault, onDelete,
}: ModeExpandedContentProps) {
    const actionColor = isActive ? '#000000' : '#ffffff';
    const actionOpacity = isActive ? 0.6 : 0.8;
    const separatorColor = isActive ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

    return (
        <View style={styles.expandedContent}>
            <Pressable
                style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.7 : 1 }]}
                onPress={onRename}
            >
                <Ionicons name="pencil-outline" size={20} color={actionColor} style={{ opacity: actionOpacity, marginRight: 12 }} />
                <Text style={[styles.actionRowText, { color: actionColor }]}>Rename</Text>
            </Pressable>

            <View style={[styles.actionRowSeparator, { backgroundColor: separatorColor }]} />

            <Pressable
                style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.7 : 1 }]}
                onPress={onToggleIconPicker}
            >
                <Ionicons name="color-palette-outline" size={20} color={actionColor} style={{ opacity: actionOpacity, marginRight: 12 }} />
                <Text style={[styles.actionRowText, { color: actionColor }]}>Change Icon</Text>
            </Pressable>

            {isIconPickerOpen ? (
                <View style={styles.iconPickerContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconPickerScroll}>
                        {CURATED_ICONS.map(icon => (
                            <Pressable
                                key={icon}
                                style={({ pressed }) => [
                                    styles.iconPickerItem,
                                    mode.icon === icon && styles.iconPickerItemSelected,
                                    { opacity: pressed ? 0.7 : 1 }
                                ]}
                                onPress={() => {
                                    haptics.impactLight();
                                    if (onUpdateIcon) onUpdateIcon(mode.id, icon);
                                }}
                            >
                                <Ionicons
                                    name={icon}
                                    size={24}
                                    color={mode.icon === icon ? '#000' : '#fff'}
                                />
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            ) : null}

            <View style={[styles.actionRowSeparator, { backgroundColor: separatorColor }]} />

            <Pressable
                style={({ pressed }) => [
                    styles.actionRow,
                    isDefault && styles.actionRowDisabled,
                    { opacity: (pressed && !isDefault) ? 0.7 : 1 }
                ]}
                onPress={onSetDefault}
                disabled={isDefault}
            >
                <Ionicons
                    name={isDefault ? 'star' : 'star-outline'}
                    size={20}
                    color={isDefault ? 'rgba(255,215,0,0.8)' : actionColor}
                    style={{ marginRight: 12, opacity: isDefault ? 1 : actionOpacity }}
                />
                <Text style={[
                    styles.actionRowText,
                    { color: actionColor },
                    isDefault ? { opacity: 0.3 } : null
                ]}>
                    {isDefault ? 'Default' : 'Set as Default'}
                </Text>
            </Pressable>

            <View style={[styles.actionRowSeparator, { backgroundColor: separatorColor }]} />

            <Pressable
                style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.7 : 1 }]}
                onPress={onDelete}
            >
                <Ionicons name="trash-outline" size={20} color="#FF453A" style={{ marginRight: 12 }} />
                <Text style={[styles.actionRowText, { color: '#FF453A' }]}>Delete Mode</Text>
            </Pressable>
        </View>
    );
});

interface ModeSelectionOverlayProps {
    visible: boolean;
    onClose: () => void;
    modes: FocusMode[];
    activeModeId: string;
    defaultModeId: string;
    onSelectMode: (mode: FocusMode) => void;
    onUpdateModeIcon?: (id: string, newIcon: keyof typeof Ionicons.glyphMap) => void;
    onSetDefaultMode?: (id: string) => void;
    onDeleteMode?: (id: string) => void;
    onAnimationComplete?: () => void;
}

export function ModeSelectionOverlay({
    visible,
    onClose,
    modes,
    activeModeId,
    defaultModeId,
    onSelectMode,
    onUpdateModeIcon,
    onSetDefaultMode,
    onDeleteMode,
    onAnimationComplete,
}: ModeSelectionOverlayProps) {
    const router = useRouter();

    const [editingModeId, setEditingModeId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

    const bgOpacity = useSharedValue(0);

    useEffect(() => {
        bgOpacity.value = withTiming(visible ? 1 : 0, { duration: 300 });
    }, [visible]);

    const derivedBgColor = useDerivedValue(() => {
        return `rgba(10, 10, 15, ${bgOpacity.value * 0.95})`;
    });

    const derivedScale = useDerivedValue(() => {
        return 0.95 + (bgOpacity.value * 0.05);
    });

    const animatedBgStyle = useAnimatedStyle(() => ({
        backgroundColor: derivedBgColor.value
    }));

    const animatedListStyle = useAnimatedStyle(() => ({
        transform: [{ scale: derivedScale.value }]
    }));

    const [closingModeId, setClosingModeId] = useState<string | null>(null);

    function toggleEdit(id: string) {
        haptics.impactLight();
        setEditingModeId(prev => {
            if (prev === id) {
                // Closing: keep content mounted via closingModeId
                setIsIconPickerOpen(false);
                setClosingModeId(id);
                return null;
            }
            setIsIconPickerOpen(false);
            setClosingModeId(null);
            return id;
        });
    }

    const handleCollapseEnd = useCallback((id: string) => {
        setClosingModeId(prev => prev === id ? null : prev);
    }, []);

    function deleteMode(id: string) {
        if (onDeleteMode) {
            haptics.notifyWarning();
            setDeletingId(id);
            onDeleteMode(id);
            setDeletingId(null);
        }
    }

    useEffect(() => {
        if (!visible && onAnimationComplete) {
            const timer = setTimeout(onAnimationComplete, 250);
            return () => clearTimeout(timer);
        }
    }, [visible, onAnimationComplete]);

    function handleOpenNewMode() {
        haptics.impactLight();
        router.push('/new-mode');
    }

    function handleOpenRename(mode: FocusMode) {
        haptics.selection();
        toggleEdit(mode.id);
        router.push({
            pathname: '/rename-mode',
            params: {
                id: mode.id,
                currentName: mode.name,
            }
        });
    }

    return (
        <Animated.View
            style={[StyleSheet.absoluteFill, { zIndex: 100 }, animatedBgStyle]}
        >
            <Animated.View style={[StyleSheet.absoluteFill, animatedListStyle]}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'center',
                        paddingVertical: 100,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Pressable
                        style={{ width: '100%', alignItems: 'center' }}
                        onPress={onClose}
                    >
                        <View style={styles.listContainer}>
                            {modes.map((mode, index) => (
                                <AnimatedOverlayItem
                                    key={mode.id}
                                    index={index}
                                    visible={visible}
                                    isActive={mode.id === activeModeId}
                                    hidden={deletingId === mode.id}
                                    expanded={editingModeId === mode.id}
                                    onCollapseEnd={() => handleCollapseEnd(mode.id)}
                                    onPress={() => {
                                        if (editingModeId === mode.id) {
                                            toggleEdit(mode.id);
                                            return;
                                        }
                                        onSelectMode(mode);
                                    }}
                                    expandedContent={
                                        (editingModeId === mode.id || closingModeId === mode.id) ? (
                                            <ModeExpandedContent
                                                mode={mode}
                                                isActive={mode.id === activeModeId}
                                                isDefault={mode.id === defaultModeId}
                                                isIconPickerOpen={isIconPickerOpen}
                                                onRename={() => handleOpenRename(mode)}
                                                onToggleIconPicker={() => {
                                                    haptics.selection();
                                                    setIsIconPickerOpen(prev => !prev);
                                                }}
                                                onUpdateIcon={onUpdateModeIcon}
                                                onSetDefault={() => {
                                                    if (mode.id === defaultModeId) return;
                                                    haptics.notifySuccess();
                                                    if (onSetDefaultMode) onSetDefaultMode(mode.id);
                                                    toggleEdit(mode.id);
                                                }}
                                                onDelete={() => deleteMode(mode.id)}
                                            />
                                        ) : null
                                    }
                                >
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <View style={{ width: '20%', alignItems: 'flex-start', justifyContent: 'center' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name={mode.icon} size={24} color={mode.id === activeModeId ? getIconColor(mode.icon) : "#ffffff"} style={{ opacity: mode.id === activeModeId ? 1 : 0.9 }} />
                                                {mode.id === defaultModeId ? (
                                                    <Ionicons name="star" size={12} color="rgba(255,215,0,0.8)" style={{ marginLeft: 4 }} />
                                                ) : null}
                                            </View>
                                        </View>

                                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={[styles.modeName, mode.id === activeModeId ? { color: '#000000' } : null]} numberOfLines={1}>{mode.name}</Text>
                                            <Text style={[styles.modeDuration, mode.id === activeModeId ? { opacity: 0.8, color: '#000000' } : null, { marginTop: 2, fontSize: 14 }]}>{mode.duration}:00</Text>
                                        </View>

                                        <View style={{ width: '20%', alignItems: 'flex-end', justifyContent: 'center' }}>
                                            <Pressable
                                                onPress={() => toggleEdit(mode.id)}
                                                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.7 })}
                                            >
                                                <Ionicons name="ellipsis-horizontal" size={24} color={mode.id === activeModeId ? 'rgba(0,0,0,0.6)' : '#ffffff'} />
                                            </Pressable>
                                        </View>
                                    </View>
                                </AnimatedOverlayItem>
                            ))}

                            <AnimatedOverlayItem
                                index={modes.length}
                                visible={visible}
                                isActive={false}
                                onPress={handleOpenNewMode}
                                glassEffect={false}
                                style={{
                                    backgroundColor: 'transparent',
                                    marginBottom: 0,
                                    marginTop: 12,
                                    alignSelf: 'center',
                                }}
                                contentStyle={{
                                    justifyContent: 'center',
                                    height: 'auto',
                                    paddingHorizontal: 20,
                                    paddingVertical: 12,
                                }}
                            >
                                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                    <View style={[styles.newTagIconCircle, { marginRight: 0, marginBottom: 8, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                                        <Ionicons name="add" size={28} color="#ffffff" />
                                    </View>
                                    <Text style={[styles.newTagText, { fontSize: 16, opacity: 0.8 }]}>New Mode</Text>
                                </View>
                            </AnimatedOverlayItem>
                        </View>
                    </Pressable>
                </ScrollView>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    listContainer: {
        width: Math.min(SCREEN_WIDTH * 0.85, 300),
    },
    modeName: {
        color: '#ffffff',
        fontSize: 18,
        fontFamily: 'SF-Pro-Rounded-Bold',
    },
    modeDuration: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'SF-Pro-Rounded-Semibold',
        opacity: 0.7,
    },
    newTagIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    newTagText: {
        color: '#ffffff',
        fontSize: 18,
        fontFamily: 'SF-Pro-Rounded-Semibold',
    },
    expandedContent: {
        paddingBottom: 8,
        paddingHorizontal: 8,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    actionRowText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'SF-Pro-Rounded-Semibold',
    },
    actionRowSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 16,
    },
    actionRowDisabled: {
        opacity: 0.5,
    },
    iconPickerContainer: {
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    iconPickerScroll: {
        paddingHorizontal: 8,
    },
    iconPickerItem: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    iconPickerItemSelected: {
        backgroundColor: '#ffffff',
    },
});
