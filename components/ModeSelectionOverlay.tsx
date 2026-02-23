import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Pressable, Dimensions, LayoutAnimation, Platform, UIManager, ScrollView } from 'react-native';
import { GlassBackground } from './GlassBackground';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as haptics from '../utils/haptics';
import { RootStackParamList } from '../App';

const CURATED_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
    'book', 'briefcase', 'fitness', 'barbell', 'library', 'code-slash',
    'laptop', 'moon', 'sunny', 'cafe', 'leaf', 'musical-notes',
    'pencil', 'brush', 'calculator', 'game-controller'
];

export const ICON_COLORS: Record<string, string> = {
    'book': '#0A84FF', // Blue
    'briefcase': '#00C7BE', // Mint
    'fitness': '#FF453A', // Red
    'barbell': '#FF9F0A', // Orange
    'library': '#BF5AF2', // Light Purple
    'code-slash': '#32ADE6', // Cyan
    'laptop': '#5E5CE6', // Indigo
    'moon': '#AF52DE', // Purple
    'sunny': '#FFD60A', // Yellow
    'cafe': '#8D6E63', // Brown
    'leaf': '#30D158', // Green
    'musical-notes': '#FF375F', // Pink
    'pencil': '#FFCC00', // Gold Yellow
    'brush': '#FF2D55', // Rose Pink
    'calculator': '#30B0C7', // Teal
    'game-controller': '#5856D6', // Deep Indigo
};

export const getIconColor = (iconName: string): string => {
    return ICON_COLORS[iconName] || '#FF453A';
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FocusMode {
    id: string;
    name: string;
    duration: number; // in minutes
    icon: keyof typeof Ionicons.glyphMap;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedOverlayItemProps {
    visible: boolean;
    isActive: boolean;
    delay: number;
    onPress: () => void;
    children: React.ReactNode;
    expandedContent?: React.ReactNode;
    style?: any;
    contentStyle?: any;
    hidden?: boolean;
    glassEffect?: boolean;
}

const AnimatedOverlayItem: React.FC<AnimatedOverlayItemProps> = ({
    visible,
    isActive,
    delay,
    onPress,
    children,
    expandedContent,
    style,
    contentStyle,
    hidden = false,
    glassEffect = true,
}) => {
    const translateYAnim = useRef(new Animated.Value(20)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current; // Micro-animation
    const viewRef = useRef<View>(null);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    delay: delay,
                    useNativeDriver: true,
                }),
                Animated.spring(translateYAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 50,
                    delay: delay,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(translateYAnim, {
                    toValue: 20,
                    friction: 8,
                    tension: 50,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
    };


    return (
        <Animated.View
            ref={viewRef}
            collapsable={false}
            style={[{
                opacity: hidden ? 0 : opacityAnim,
                transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
                borderRadius: 34,
                marginBottom: 12,
                // @ts-ignore
                cornerCurve: 'continuous',
                overflow: 'hidden',
                backgroundColor: 'transparent',
                ...(glassEffect ? {
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                } : {}),
            }, style]}>
            {!hidden && glassEffect && (
                <GlassBackground
                    style={StyleSheet.absoluteFill}
                    glassStyle="clear"
                    tint={isActive ? 'light' : 'dark'}
                    intensity={80}
                    fallbackColor={isActive ? 'rgba(255, 255, 255, 0.15)' : 'rgba(50, 50, 60, 0.85)'}
                />
            )}
            <Pressable
                style={[{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 24,
                    height: 68,
                }, contentStyle]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                {children}
            </Pressable>
            {expandedContent}
        </Animated.View>
    );
};

interface ModeSelectionOverlayProps {
    visible: boolean;
    onClose: () => void;
    modes: FocusMode[];
    activeModeId: string;
    defaultModeId: string;
    onSelectMode: (mode: FocusMode) => void;
    onUpdateMode?: (id: string, newDuration: number) => void;
    onUpdateModeIcon?: (id: string, newIcon: keyof typeof Ionicons.glyphMap) => void;
    onRenameMode?: (id: string, newName: string) => void;
    onSetDefaultMode?: (id: string) => void;
    onDeleteMode?: (id: string) => void;
    onCreateMode?: (mode: Omit<FocusMode, 'id'>) => void;
    onAnimationComplete?: () => void;
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const ModeSelectionOverlay: React.FC<ModeSelectionOverlayProps> = ({
    visible,
    onClose,
    modes,
    activeModeId,
    defaultModeId,
    onSelectMode,
    onUpdateMode,
    onUpdateModeIcon,
    onRenameMode,
    onSetDefaultMode,
    onDeleteMode,
    onCreateMode,
    onAnimationComplete,
    navigation,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Inline adjustment state
    const [editingModeId, setEditingModeId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

    const toggleEdit = (id: string) => {
        haptics.impactLight();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (editingModeId === id) {
            setEditingModeId(null);
            setIsIconPickerOpen(false);
        } else {
            setEditingModeId(id);
            setIsIconPickerOpen(false);
        }
    };

    const deleteMode = (id: string) => {
        if (onDeleteMode) {
            haptics.notifyWarning();

            LayoutAnimation.configureNext({
                duration: 600,
                create: { type: LayoutAnimation.Types.spring, springDamping: 0.9, property: LayoutAnimation.Properties.opacity },
                update: { type: LayoutAnimation.Types.spring, springDamping: 0.9 },
                delete: { type: LayoutAnimation.Types.spring, springDamping: 0.8, property: LayoutAnimation.Properties.opacity },
            });

            setDeletingId(id);
            onDeleteMode(id);

            setTimeout(() => setDeletingId(null), 500);
        }
    };

    useEffect(() => {
        if (visible) {
            setDeletingId(null);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished && onAnimationComplete) {
                    onAnimationComplete();
                }
            });
        }
    }, [visible]);

    const handleOpenNewMode = () => {
        haptics.impactLight();
        navigation.navigate('NewModeSheet');
    };

    const handleOpenRename = (mode: FocusMode) => {
        haptics.selection();
        toggleEdit(mode.id);
        navigation.navigate('RenameSheet', {
            id: mode.id,
            currentName: mode.name,
        });
    };

    return (
        <Animated.View
            style={[StyleSheet.absoluteFill, { zIndex: 100 }]}
            pointerEvents={visible ? 'auto' : 'none'}
        >
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
                <GlassBackground
                    style={StyleSheet.absoluteFill}
                    glassStyle="regular"
                    tint="dark"
                    intensity={95}
                    fallbackColor="rgba(30, 30, 35, 0.95)"
                />
            </Animated.View>

            <View style={styles.container} pointerEvents="box-none">
                <ScrollView
                    style={{ flex: 1, width: '100%' }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Pressable
                        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingBottom: 120 }}
                        onPress={onClose}
                    >
                        <Pressable style={styles.listContainer} onStartShouldSetResponder={() => true}>
                            {modes.map((mode, index) => (
                                <AnimatedOverlayItem
                                    key={mode.id}
                                    visible={visible}
                                    isActive={mode.id === activeModeId}
                                    delay={index * 40}
                                    hidden={deletingId === mode.id}
                                    onPress={() => {
                                        if (editingModeId === mode.id) {
                                            toggleEdit(mode.id);
                                            return;
                                        }
                                        onSelectMode(mode);
                                    }}
                                    expandedContent={
                                        editingModeId === mode.id ? (
                                            <View style={styles.expandedContent}>
                                                <TouchableOpacity
                                                    style={styles.actionRow}
                                                    onPress={() => handleOpenRename(mode)}
                                                >
                                                    <Ionicons name="pencil-outline" size={20} color="#ffffff" style={{ opacity: 0.8, marginRight: 12 }} />
                                                    <Text style={styles.actionRowText}>Rename</Text>
                                                </TouchableOpacity>

                                                <View style={styles.actionRowSeparator} />

                                                <TouchableOpacity
                                                    style={styles.actionRow}
                                                    onPress={() => {
                                                        haptics.selection();
                                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                                        setIsIconPickerOpen(prev => !prev);
                                                    }}
                                                >
                                                    <Ionicons name="color-palette-outline" size={20} color="#ffffff" style={{ opacity: 0.8, marginRight: 12 }} />
                                                    <Text style={styles.actionRowText}>Change Icon</Text>
                                                </TouchableOpacity>

                                                {isIconPickerOpen && (
                                                    <View style={styles.iconPickerContainer}>
                                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconPickerScroll}>
                                                            {CURATED_ICONS.map(icon => (
                                                                <TouchableOpacity
                                                                    key={icon}
                                                                    style={[
                                                                        styles.iconPickerItem,
                                                                        mode.icon === icon && styles.iconPickerItemSelected
                                                                    ]}
                                                                    onPress={() => {
                                                                        haptics.impactLight();
                                                                        if (onUpdateModeIcon) onUpdateModeIcon(mode.id, icon);
                                                                    }}
                                                                >
                                                                    <Ionicons
                                                                        name={icon}
                                                                        size={24}
                                                                        color={mode.icon === icon ? '#000' : '#fff'}
                                                                    />
                                                                </TouchableOpacity>
                                                            ))}
                                                        </ScrollView>
                                                    </View>
                                                )}

                                                <View style={styles.actionRowSeparator} />

                                                <TouchableOpacity
                                                    style={[styles.actionRow, mode.id === defaultModeId && styles.actionRowDisabled]}
                                                    onPress={() => {
                                                        if (mode.id === defaultModeId) return;
                                                        haptics.notifySuccess();
                                                        if (onSetDefaultMode) onSetDefaultMode(mode.id);
                                                        toggleEdit(mode.id);
                                                    }}
                                                    disabled={mode.id === defaultModeId}
                                                >
                                                    <Ionicons
                                                        name={mode.id === defaultModeId ? 'star' : 'star-outline'}
                                                        size={20}
                                                        color={mode.id === defaultModeId ? 'rgba(255,255,255,0.3)' : '#ffffff'}
                                                        style={{ marginRight: 12, opacity: mode.id === defaultModeId ? 1 : 0.8 }}
                                                    />
                                                    <Text style={[
                                                        styles.actionRowText,
                                                        mode.id === defaultModeId && { opacity: 0.3 }
                                                    ]}>
                                                        {mode.id === defaultModeId ? 'Default' : 'Set as Default'}
                                                    </Text>
                                                </TouchableOpacity>

                                                <View style={styles.actionRowSeparator} />

                                                <TouchableOpacity
                                                    style={styles.actionRow}
                                                    onPress={() => deleteMode(mode.id)}
                                                >
                                                    <Ionicons name="trash-outline" size={20} color="#FF453A" style={{ marginRight: 12 }} />
                                                    <Text style={[styles.actionRowText, { color: '#FF453A' }]}>Delete Mode</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : null
                                    }
                                >
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <View style={{ width: '20%', alignItems: 'flex-start', justifyContent: 'center' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name={mode.icon} size={24} color={mode.id === activeModeId ? getIconColor(mode.icon) : "#ffffff"} style={{ opacity: mode.id === activeModeId ? 1 : 0.9 }} />
                                                {mode.id === defaultModeId && (
                                                    <Ionicons name="star" size={12} color="rgba(255,215,0,0.8)" style={{ marginLeft: 4 }} />
                                                )}
                                            </View>
                                        </View>

                                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={[styles.modeName, mode.id === activeModeId && { color: '#ffffff' }]} numberOfLines={1}>{mode.name}</Text>
                                            <Text style={[styles.modeDuration, mode.id === activeModeId && { opacity: 0.9, color: '#ffffff' }, { marginTop: 2, fontSize: 14 }]}>{mode.duration}:00</Text>
                                        </View>

                                        <View style={{ width: '20%', alignItems: 'flex-end', justifyContent: 'center' }}>
                                            <TouchableOpacity
                                                onPress={() => toggleEdit(mode.id)}
                                                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                            >
                                                <Ionicons name="ellipsis-horizontal" size={24} color="#ffffff" style={{ opacity: 0.7 }} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </AnimatedOverlayItem>
                            ))}

                            <AnimatedOverlayItem
                                visible={visible}
                                isActive={false}
                                delay={modes.length * 40}
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
                        </Pressable>
                    </Pressable>
                </ScrollView>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        width: Math.min(SCREEN_WIDTH * 0.85, 300),
    },
    modeTextContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    contextMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: 24,
    },
    contextMenuText: {
        color: '#ffffff',
        fontSize: 18,
        fontFamily: 'SF-Pro-Rounded-Semibold',
    },
    contextMenuTextDelete: {
        color: '#FF453A',
        fontSize: 18,
        fontFamily: 'SF-Pro-Rounded-Semibold',
    },
    contextMenuSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.12)',
        marginHorizontal: 16,
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
