// src/components/Search/SearchHeader.js
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';
import { scale, spacing, fontSizes } from '../../utils/dimensions';

const SearchHeader = ({
  searchTerm,
  isFocused,
  inputScale,
  onChangeText,
  onClear,
  onFocus,
  onBlur,
}) => {
  const inputContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  return (
    <LinearGradient colors={['#282828', '#161616']} style={styles.header}>
      <Animated.View style={[styles.inputWrapper, inputContainerStyle]}>
        <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
          <Icon name="search" size={20} color={isFocused ? Colors.primary : Colors.gray500} />
          <TextInput
            style={styles.input}
            placeholder="Search tales..."
            placeholderTextColor={Colors.gray500}
            onChangeText={onChangeText}
            value={searchTerm}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          {searchTerm ? (
            <TouchableOpacity onPress={onClear} style={styles.clearButton}>
              <Icon name="close-circle" size={20} color={Colors.gray500} />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: scale(24),
    borderBottomRightRadius: scale(24),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark800,
    borderRadius: scale(12),
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark700,
  },
  searchContainerFocused: {
    borderColor: Colors.primary,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: fontSizes.md,
    marginHorizontal: spacing.sm,
    padding: 0,
  },
  clearButton: {
    padding: spacing.xs,
  },
});

export default SearchHeader;
