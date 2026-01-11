import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';

export const Container = ({ children }: { children: React.ReactNode }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
  return <View style={styles.container}>{children}</View>;
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
    backgroundColor: theme.colors.background,
  },
});
