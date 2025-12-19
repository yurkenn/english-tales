import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsDark, useThemeKey } from '@/store/themeStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useNotifications } from '@/hooks/useNotifications';
import { lightTheme, darkTheme } from '@/theme/unistyles';

type TabIconName = 'home' | 'compass' | 'book' | 'person' | 'people';

interface TabIconProps {
    name: TabIconName;
    focused: boolean;
    color: string;
}

const AnimatedIcon = Animated.createAnimatedComponent(View);

const TabIcon: React.FC<TabIconProps> = ({ name, focused, color }) => {
    const icons: Record<TabIconName, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
        home: { active: 'home', inactive: 'home-outline' },
        compass: { active: 'compass', inactive: 'compass-outline' },
        book: { active: 'bookmark', inactive: 'bookmark-outline' },
        person: { active: 'person-circle', inactive: 'person-circle-outline' },
        people: { active: 'people', inactive: 'people-outline' },
    };

    const iconName = focused ? icons[name].active : icons[name].inactive;

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: withSpring(focused ? 1 : 0.95, { damping: 15, stiffness: 200 }) },
        ],
    }));

    return (
        <AnimatedIcon style={animatedStyle}>
            <Ionicons
                name={iconName}
                size={28}
                color={color}
            />
        </AnimatedIcon>
    );
};

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    useNotifications(); // Initialize subscription
    const unreadCount = useNotificationStore(s => s.unreadCount);

    // Subscribe to theme changes
    const isDark = useIsDark();
    const themeKey = useThemeKey();

    // Get theme based on isDark state directly
    const theme = isDark ? darkTheme : lightTheme;

    const tabBarStyle = useMemo(() => ({
        backgroundColor: theme.colors.surface,
        borderTopWidth: 0.5,
        borderTopColor: theme.colors.borderLight,
        height: 50 + insets.bottom,
        paddingBottom: insets.bottom > 0 ? insets.bottom - 8 : 4,
        paddingTop: 8,
        elevation: 0,
        shadowOpacity: 0,
    }), [theme.colors.surface, theme.colors.borderLight, insets.bottom, themeKey]);

    const screenOptions = useMemo(() => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarShowLabel: false,
        tabBarStyle: tabBarStyle,
    }), [theme.colors.text, theme.colors.textMuted, tabBarStyle, themeKey]);

    return (
        <Tabs screenOptions={screenOptions} key={`tabs-${themeKey}`}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon name="home" focused={focused} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="discover"
                options={{
                    title: 'Discover',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon name="compass" focused={focused} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="community"
                options={{
                    title: 'Community',
                    tabBarIcon: ({ focused, color }) => (
                        <View>
                            <TabIcon name="people" focused={focused} color={color} />
                            {unreadCount > 0 && (
                                <View style={{
                                    position: 'absolute',
                                    right: -4,
                                    top: -2,
                                    backgroundColor: theme.colors.error,
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    borderWidth: 1.5,
                                    borderColor: theme.colors.surface,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="library"
                options={{
                    title: 'Library',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon name="book" focused={focused} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon name="person" focused={focused} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
