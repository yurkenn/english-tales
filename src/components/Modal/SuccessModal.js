import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Colors } from '../../constants/colors';
import CustomButton from '../CustomButton';
import Icon from '../Icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { scale, spacing, fontSizes, wp } from '../../utils/dimensions';

const SuccessModal = ({ visible, onClose, title, message, buttonText = 'Done' }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
          <Animated.View entering={ZoomIn.duration(300).delay(200)} style={styles.content}>
            <View style={styles.iconContainer}>
              <Icon name="checkmark-circle" size={scale(48)} color={Colors.primary} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {/* Custom width button container */}
            <View style={styles.buttonContainer}>
              <CustomButton
                title={buttonText}
                onPress={onClose}
                style={styles.button}
                textStyle={styles.buttonText}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: wp(85),
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: Colors.dark800,
    borderRadius: scale(16),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    // This container will control the button width
    width: '60%', // The button will take 60% of the modal width
    alignItems: 'center',
  },
  button: {
    width: '100%', // Take full width of the container
    minWidth: scale(140), // Ensure minimum width
    maxWidth: scale(200), // Maximum width to maintain proportion
    height: scale(44), // Slightly smaller height for modal context
  },
  buttonText: {
    fontSize: fontSizes.md, // Slightly smaller font for modal context
  },
});

export default SuccessModal;
