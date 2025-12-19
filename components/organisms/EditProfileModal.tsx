import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Modal } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    initialName: string;
    onSave: (name: string) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
    visible,
    onClose,
    initialName,
    onSave,
}) => {
    const { theme } = useUnistyles();
    const [name, setName] = useState(initialName);
    const [isSaving, setIsSaving] = useState(false);
    const toastActions = useToastStore((state) => state.actions);

    const handleSave = async () => {
        if (!name.trim()) {
            haptics.error();
            toastActions.error('Display name cannot be empty');
            return;
        }
        setIsSaving(true);
        try {
            await onSave(name.trim());
            haptics.success();
            toastActions.success('Profile updated successfully');
            onClose();
        } catch (error) {
            haptics.error();
            toastActions.error('Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Edit Profile</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </Pressable>
                    </View>

                    <Text style={styles.inputLabel}>Display Name</Text>
                    <TextInput
                        style={styles.textInput}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your name"
                        placeholderTextColor={theme.colors.textMuted}
                    />

                    <Pressable
                        style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
                        disabled={isSaving}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create((theme) => ({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.radius.xxl,
        borderTopRightRadius: theme.radius.xxl,
        padding: theme.spacing.xl,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    inputLabel: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    textInput: {
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        fontSize: theme.typography.size.lg,
        color: theme.colors.text,
        marginBottom: theme.spacing.xl,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.full,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.textInverse,
    },
}));
