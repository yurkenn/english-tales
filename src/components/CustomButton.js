import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  Image,
  Animated,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';
import { scale, spacing, fontSizes, wp } from '../utils/dimensions';
import { INPUT_HEIGHT } from './CustomInput';

const CustomButton = ({
  onPress,
  title,
  style,
  textStyle,
  imageSource,
  imageStyle,
  variant = 'filled', // filled, outlined, text
  loading = false,
  disabled = false,
  ...props
}) => {
  const [pressAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Haptics.selectionAsync();
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          container: styles.outlinedButton,
          text: styles.outlinedButtonText,
        };
      case 'text':
        return {
          container: styles.textButton,
          text: styles.textButtonText,
        };
      default:
        return {
          container: styles.filledButton,
          text: styles.filledButtonText,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Animated.View
      style={[
        styles.buttonContainer,
        {
          transform: [{ scale: pressAnim }],
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <TouchableOpacity
        onPress={!loading && !disabled ? onPress : null}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.button, variantStyles.container, style]}
        activeOpacity={0.9}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            {imageSource && <Image source={imageSource} style={[styles.image, imageStyle]} />}
            <Text style={[styles.text, variantStyles.text, textStyle]}>{title}</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: wp(90),
    height: INPUT_HEIGHT,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    borderRadius: scale(8),
  },
  // Filled variant
  filledButton: {
    backgroundColor: Colors.primary,
  },
  filledButtonText: {
    color: Colors.white,
  },
  // Outlined variant
  outlinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  outlinedButtonText: {
    color: Colors.primary,
  },
  // Text variant
  textButton: {
    backgroundColor: 'transparent',
  },
  textButtonText: {
    color: Colors.primary,
  },
  text: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  image: {
    width: scale(20),
    height: scale(20),
    marginRight: spacing.sm,
  },
});

export default CustomButton;
