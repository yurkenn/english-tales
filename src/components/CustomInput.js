import React, { useState } from 'react';
import { View, TextInput, Animated, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import Icon from './Icons';
import * as Haptics from 'expo-haptics';
import { scale, spacing, fontSizes, wp } from '../utils/dimensions';

export const INPUT_HEIGHT = scale(48);

const CustomInput = ({
  placeholder,
  onChangeText,
  value,
  isSecure,
  icon,
  onPress,
  onFocus,
  onBlur,
  error,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureEntry, setIsSecureEntry] = useState(isSecure);
  const focusAnim = new Animated.Value(0);

  const handleFocus = () => {
    setIsFocused(true);
    Haptics.selectionAsync();
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onBlur?.();
  };

  const toggleSecureEntry = () => {
    Haptics.selectionAsync();
    setIsSecureEntry(!isSecureEntry);
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.dark300, Colors.primary],
  });

  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.dark500, Colors.dark500 + 'CC'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor,
          backgroundColor,
        },
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={scale(20)}
          color={isFocused ? Colors.primary : Colors.gray500}
          style={styles.leftIcon}
        />
      )}

      <TextInput
        style={[styles.input, icon && styles.inputWithIcon, error && styles.inputError]}
        placeholderTextColor={Colors.gray500}
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={isSecureEntry}
        selectionColor={Colors.primary}
        {...props}
      />

      {isSecure && (
        <Icon
          name={isSecureEntry ? 'eye-off' : 'eye'}
          size={scale(20)}
          color={Colors.gray500}
          style={styles.rightIcon}
          onPress={toggleSecureEntry}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: wp(90),
    height: INPUT_HEIGHT,
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: fontSizes.md,
    height: '100%',
    padding: 0,
  },
  inputWithIcon: {
    marginLeft: spacing.md,
  },
  inputError: {
    color: Colors.error,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
  },
});

export default CustomInput;
