// src/components/Content/HeaderNavbar.js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { fontSizes, spacing } from '../../utils/dimensions';
import Icon from '../Icons';

const HeaderNavbar = ({ title, style }) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.container, style]}>
      <Icon name="arrow-back" size={24} color={Colors.white} onPress={() => navigation.goBack()} />
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: Colors.dark900 + '80',
  },
  title: {
    flex: 1,
    color: Colors.white,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  placeholder: {
    width: 24,
  },
});

export default HeaderNavbar;
