import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

type TabIconName = 'home' | 'compass' | 'book' | 'person';

export default function TabLayout() {
    const { theme } = useUnistyles();

    const getTabIcon = (
        name: TabIconName,
        focused: boolean
    ): keyof typeof Ionicons.glyphMap => {
        const icons: Record<TabIconName, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
            home: { active: 'home', inactive: 'home-outline' },
            compass: { active: 'compass', inactive: 'compass-outline' },
            book: { active: 'book', inactive: 'book-outline' },
            person: { active: 'person', inactive: 'person-outline' },
        };
        return focused ? icons[name].active : icons[name].inactive;
    };

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textMuted,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.borderLight,
                    height: theme.tabBar.height + 20, // extra for safe area
                    paddingTop: theme.spacing.sm,
                    paddingBottom: theme.spacing.xl,
                    ...theme.shadows.sm,
                },
                tabBarLabelStyle: {
                    fontSize: theme.typography.size.xs,
                    fontWeight: theme.typography.weight.medium,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons
                            name={getTabIcon('home', focused)}
                            size={theme.tabBar.iconSize}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="discover"
                options={{
                    title: 'Discover',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons
                            name={getTabIcon('compass', focused)}
                            size={theme.tabBar.iconSize}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="library"
                options={{
                    title: 'Library',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons
                            name={getTabIcon('book', focused)}
                            size={theme.tabBar.iconSize}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused, color }) => (
                        <Ionicons
                            name={getTabIcon('person', focused)}
                            size={theme.tabBar.iconSize}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
