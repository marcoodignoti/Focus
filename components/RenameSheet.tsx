import React, { useState, useRef } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, Pressable,
    TextInput, Platform, Keyboard, KeyboardAvoidingView, Animated, DeviceEventEmitter
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassBackground } from './GlassBackground';
import * as haptics from '../utils/haptics';
import { RootStackParamList } from '../App';
import { useSheetAnimation } from '../store/useSheetAnimation';

type Props = NativeStackScreenProps<RootStackParamList, 'RenameSheet'>;

export const RenameSheet: React.FC<Props> = ({ route, navigation }) => {
    const { id, currentName } = route.params;
    const inputRef = useRef<TextInput>(null);

    const [name, setName] = useState(currentName);

    const { fadeAnim, slideAnim, panResponder, closeWithAnimation } = useSheetAnimation(
        () => navigation.goBack()
    );

    const handleSave = () => {
        if (!name.trim() || name.trim() === currentName) return;
        haptics.notifySuccess();

        closeWithAnimation(() => {
            DeviceEventEmitter.emit('renameMode', { id, name: name.trim() });
            navigation.goBack();
        });
    };

    const handleClose = () => {
        closeWithAnimation(() => navigation.goBack());
    };

    const isSaveDisabled = !name.trim() || name.trim() === currentName;

    const sheetContent = (
        <>
            <View style={styles.grabber} />
            <View style={styles.sheetHeader}>
                <TouchableOpacity style={styles.closeButton} onPress={handleClose} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                    <Ionicons name="close" size={24} color="#ffffff" style={{ opacity: 0.8 }} />
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>Rename Mode</Text>
                <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: isSaveDisabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }]}
                    onPress={handleSave}
                    disabled={isSaveDisabled}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <Ionicons name="checkmark" size={24} color={isSaveDisabled ? "rgba(255,255,255,0.3)" : "#ffffff"} />
                </TouchableOpacity>
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.sectionLabel}>Name</Text>
                <TextInput
                    ref={inputRef}
                    style={styles.textInput}
                    placeholder="e.g. Coding"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={name}
                    onChangeText={setName}
                    maxLength={15}
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
                    selectTextOnFocus
                    autoFocus
                />
            </View>
        </>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
        >
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
                    <GlassBackground
                        style={StyleSheet.absoluteFill}
                        glassStyle="regular"
                        tint="dark"
                        intensity={60}
                        fallbackColor="rgba(0, 0, 0, 0.5)"
                    />
                </Pressable>
            </Animated.View>

            <Animated.View {...panResponder.panHandlers} style={{ transform: [{ translateY: slideAnim }] }}>
                <GlassBackground
                    style={styles.sheetContainer}
                    glassStyle="regular"
                    tint="dark"
                    intensity={90}
                    fallbackColor="rgba(30,30,35,0.95)"
                >
                    {sheetContent}
                </GlassBackground>
            </Animated.View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    keyboardAvoid: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        marginHorizontal: 8,
        marginBottom: 32, // Floating padding from bottom
        borderRadius: 32,
        // @ts-ignore
        cornerCurve: 'continuous',
        padding: 24,
        paddingTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 20,
        overflow: 'hidden',
    },
    grabber: {
        width: 36,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 16,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheetTitle: {
        flex: 1,
        color: '#ffffff',
        fontSize: 24,
        fontFamily: 'SF-Pro-Rounded-Bold',
        textAlign: 'center',
    },
    inputSection: {
        marginBottom: 32,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontFamily: 'SF-Pro-Rounded-Semibold',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 50,
        padding: 16,
        paddingHorizontal: 20,
        color: '#ffffff',
        fontSize: 18,
        fontFamily: 'SF-Pro-Rounded-Semibold',
    },
    saveButton: {
        backgroundColor: '#ffffff',
        borderRadius: 50,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.3,
    },
    saveButtonText: {
        color: '#000000',
        fontSize: 18,
        fontFamily: 'SF-Pro-Rounded-Bold',
    },
});
