import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

export const OfflineBanner = () => {
    const { theme } = useUnistyles();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const netInfo = useNetInfo();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Show banner only if explicitly known to be offline
        // netInfo.isConnected can be null initially, waiting for false
        if (netInfo.isConnected === false) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [netInfo.isConnected]);

    if (!visible) return null;

    return (
        <Animated.View
            entering={FadeInUp.duration(300)}
            exiting={FadeOutUp.duration(300)}
            style={[
                styles.container,
                { paddingTop: insets.top + (insets.top > 0 ? 0 : 8) }
            ]}
        >
            <View style={styles.content}>
                <Ionicons name="cloud-offline" size={16} color="#FFFFFF" />
                <Text style={styles.text}>
                    {t('common.offlineMessage', 'No internet connection. You can read downloaded stories.')}
                </Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.error,
        zIndex: 9999,
        paddingBottom: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
}));
