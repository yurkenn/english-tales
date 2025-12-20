import React from 'react';
import { Tabs } from 'expo-router';
import { useNotifications } from '@/hooks/useNotifications';
import { CustomTabBar } from '@/components/organisms/CustomTabBar';

export default function TabLayout() {
    useNotifications(); // Initialize subscription

    return (
        <Tabs
            tabBar={(props) => {
                if (!CustomTabBar) {
                    console.error('CustomTabBar is undefined in TabLayout!');
                    return null;
                }
                return <CustomTabBar {...props} />;
            }}
            screenOptions={{
                headerShown: false,
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
