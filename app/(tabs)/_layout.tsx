import React from 'react';
import { Tabs } from 'expo-router';
import { useNotifications } from '@/hooks/useNotifications';
import { CustomTabBar } from '@/components/organisms/CustomTabBar';

export default function TabLayout() {
    useNotifications(); // Initialize subscription

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: { display: 'flex' }, // Ensure default tab bar is visible
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                }}
            />
            <Tabs.Screen
                name="discover"
                options={{
                    title: 'Discover',
                }}
            />
            <Tabs.Screen
                name="community"
                options={{
                    title: 'Community',
                }}
            />
            <Tabs.Screen
                name="library"
                options={{
                    title: 'Library',
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                }}
            />
        </Tabs>
    );
}
