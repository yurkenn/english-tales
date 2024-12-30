import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import CustomButton from '../CustomButton';
import Icon from '../Icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { scale, spacing, fontSizes, wp } from '../../utils/dimensions';
import BottomSheet from '@gorhom/bottom-sheet';

const ErrorModal = ({ visible, onClose, title = 'Error', message, buttonText = 'Try Again' }) => {
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
            <Icon name="alert-circle" size={scale(48)} color={Colors.error} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <CustomButton
            title={buttonText}
            onPress={onClose}
            style={styles.button}
            variant="outlined"
          />
        </Animated.View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: Colors.dark800,
    borderRadius: scale(16),
  },
  content: {
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: Colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSizes.md,
    color: Colors.gray300,
    textAlign: 'center',
    lineHeight: scale(22),
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.md,
    borderColor: Colors.error,
  },
});

export default ErrorModal;
