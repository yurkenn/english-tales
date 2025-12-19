import React from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface SettingItemProps {
    icon: IconName;
    label: string;
    value?: string;
    hasChevron?: boolean;
    onPress?: () => void;
    isDestructive?: boolean;
}

export interface SettingToggleProps {
    icon: IconName;
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}
