import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Colors } from '../../constants/colors';
import CustomButton from '../CustomButton';
import Icon from '../Icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { scale, spacing, fontSizes, wp } from '../../utils/dimensions';

const ErrorModal = ({ visible, onClose, title = 'Error', message, buttonText = 'Try Again' }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
          <Animated.View entering={ZoomIn.duration(300).delay(200)} style={styles.content}>
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
    padding: spacing.lg,
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
