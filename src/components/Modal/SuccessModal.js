import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import CustomButton from '../CustomButton';
import Icon from '../Icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { scale, spacing, fontSizes, wp } from '../../utils/dimensions';
import BottomSheet from '@gorhom/bottom-sheet';

const SuccessModal = ({ visible, onClose, title, message, buttonText = 'Done' }) => {
  const bottomSheetRef = useRef(null);

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={['50%']}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: Colors.dark800 }}
      handleIndicatorStyle={{ backgroundColor: Colors.gray500 }}
    >
      <View style={styles.container}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="checkmark-circle" size={scale(48)} color={Colors.primary} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            <CustomButton
              title={buttonText}
              onPress={onClose}
              style={styles.button}
              textStyle={styles.buttonText}
            />
          </View>
        </Animated.View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: Colors.dark800,
    borderRadius: scale(16),
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSizes.md,
    color: Colors.gray300,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
    lineHeight: fontSizes.md * 1.5,
  },
  buttonContainer: {
    width: '60%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    minWidth: scale(140),
    maxWidth: scale(200),
    height: scale(44),
  },
  buttonText: {
    fontSize: fontSizes.md,
  },
});

export default SuccessModal;
