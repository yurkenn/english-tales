import React from 'react';
import { View, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    withSpring,
    interpolateColor,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';

type TabIconName = 'home' | 'compass' | 'book' | 'person';

interface TabIconProps {
    name: TabIconName;
    focused: boolean;
    color: string;
}

const AnimatedIcon = Animated.createAnimatedComponent(View);

const TabIcon: React.FC<TabIconProps> = ({ name, focused, color }) => {
    const { theme } = useUnistyles();

    const icons: Record<TabIconName, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
        home: { active: 'home', inactive: 'home-outline' },
        compass: { active: 'compass', inactive: 'compass-outline' },
        book: { active: 'bookmark', inactive: 'bookmark-outline' },
        person: { active: 'person-circle', inactive: 'person-circle-outline' },
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
    const { theme } = useUnistyles();
    const insets = useSafeAreaInsets();
    const themeMode = useThemeStore((s) => s.mode);

    // Create tabBarStyle with current theme values
    const tabBarStyle = {
        backgroundColor: theme.colors.surface,
        borderTopWidth: 0.5,
        borderTopColor: theme.colors.borderLight,
        height: 50 + insets.bottom,
        paddingBottom: insets.bottom > 0 ? insets.bottom - 8 : 4,
        paddingTop: 8,
        elevation: 0,
        shadowOpacity: 0,
    };

    return (
        <Tabs
            key={themeMode} // Force re-render when theme changes
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.text,
                tabBarInactiveTintColor: theme.colors.textMuted,
                tabBarShowLabel: false,
                tabBarStyle: tabBarStyle,
            }}
        >
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

