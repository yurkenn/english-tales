import React, { useEffect, useState } from 'react';
import { View, Pressable, LayoutChangeEvent, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/utils/haptics';
import { useNotificationStore } from '@/store/notificationStore';

const TAB_BAR_WIDTH_PERCENT = 0.94;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CONTAINER_WIDTH = SCREEN_WIDTH * TAB_BAR_WIDTH_PERCENT;
const BUBBLE_PADDING = 6; // Padding around the bubble within each tab slot

const SPRING_CONFIG = {
    damping: 20,
    stiffness: 180,
    mass: 0.8,
};

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    const { theme } = useUnistyles();
    const insets = useSafeAreaInsets();
    const unreadCount = useNotificationStore(s => s.unreadCount);
    const [tabWidth, setTabWidth] = useState(CONTAINER_WIDTH / state.routes.length);

    const translateX = useSharedValue(state.index * (CONTAINER_WIDTH / state.routes.length));

    useEffect(() => {
        translateX.value = withSpring(state.index * tabWidth, SPRING_CONFIG);
    }, [state.index, tabWidth]);

    const onLayout = (e: LayoutChangeEvent) => {
        const { width } = e.nativeEvent.layout;
        setTabWidth(width / state.routes.length);
    };

    const animatedIndicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value + BUBBLE_PADDING }],
        width: tabWidth - (BUBBLE_PADDING * 2),
    }));

    const icons: Record<string, { name: keyof typeof Feather.glyphMap }> = {
        index: { name: 'home' },
        discover: { name: 'compass' },
        community: { name: 'users' },
        library: { name: 'book-open' },
        profile: { name: 'user' },
    };

    return (
        <View style={[styles.outerContainer, { bottom: insets.bottom > 0 ? insets.bottom + 10 : 20 }]}>
            <View style={styles.container} onLayout={onLayout}>
                {/* Sliding Indicator Bubble (Minimalist Semi-transparent) */}
                <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />

                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;
                    const iconConfig = icons[route.name] || { name: 'square' };

                    const onPress = () => {
                        haptics.selection();
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <Pressable
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={(options as any).tabBarTestID}
                            onPress={onPress}
                            style={styles.tabItem}
                        >
                            <TabItemContent
                                isFocused={isFocused}
                                iconName={iconConfig.name}
                                activeColor={theme.colors.primary}
                                inactiveColor={theme.colors.textMuted}
                            />
                            {route.name === 'community' && unreadCount > 0 && (
                                <View style={[
                                    styles.unreadBadge,
                                    {
                                        backgroundColor: theme.colors.error,
                                        borderColor: theme.colors.surface
                                    }
                                ]} />
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const TabItemContent = ({ isFocused, iconName, activeColor, inactiveColor }: { isFocused: boolean; iconName: any; activeColor: string; inactiveColor: string }) => {
    const progress = useSharedValue(isFocused ? 1 : 0);

    useEffect(() => {
        progress.value = withSpring(isFocused ? 1 : 0, SPRING_CONFIG);
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: interpolate(progress.value, [0, 1], [1, 1.1]) },
            { translateY: interpolate(progress.value, [0, 1], [0, -1]) },
        ],
    }));

    return (
        <Animated.View style={[styles.iconWrapper, animatedStyle]}>
            <Feather
                name={iconName}
                size={22}
                color={isFocused ? activeColor : inactiveColor}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create((theme) => ({
    outerContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    container: {
        flexDirection: 'row',
        width: `${TAB_BAR_WIDTH_PERCENT * 100}%`,
        height: 60,
        backgroundColor: theme.colors.surface,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        // Premium shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    indicator: {
        position: 'absolute',
        height: 44,
        backgroundColor: theme.colors.primary + '15', // Minimalist semi-transparent
        borderRadius: 22,
        top: 8,
    },
    tabItem: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    unreadBadge: {
        position: 'absolute',
        top: 14,
        right: '25%',
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
    },
}));
