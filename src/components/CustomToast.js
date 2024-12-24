import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from './Icons';
import { Colors } from '../constants/colors';
import { scale, spacing, fontSizes } from '../utils/dimensions';

const CustomToast = () => {
  const toastConfig = {
    success: ({ text1, text2, ...props }) => (
      <View style={[styles.container, styles.successBorder]}>
        <View style={[styles.iconContainer, styles.successBackground]}>
          <Icon name="checkmark" size={20} color={Colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>{text1}</Text>
          {text2 && <Text style={styles.messageText}>{text2}</Text>}
        </View>
      </View>
    ),
    error: ({ text1, text2, ...props }) => (
      <View style={[styles.container, styles.errorBorder]}>
        <View style={[styles.iconContainer, styles.errorBackground]}>
          <Icon name="close" size={20} color={Colors.error} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>{text1}</Text>
          {text2 && <Text style={styles.messageText}>{text2}</Text>}
        </View>
      </View>
    ),
    info: ({ text1, text2, ...props }) => (
      <View style={[styles.container, styles.infoBorder]}>
        <View style={[styles.iconContainer, styles.infoBackground]}>
          <Icon name="information" size={20} color={Colors.info} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>{text1}</Text>
          {text2 && <Text style={styles.messageText}>{text2}</Text>}
        </View>
      </View>
    ),
  };

  return <Toast config={toastConfig} />;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    backgroundColor: Colors.dark800,
    borderRadius: scale(12),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successBorder: {
    borderColor: Colors.primary + '30',
  },
  errorBorder: {
    borderColor: Colors.error + '30',
  },
  infoBorder: {
    borderColor: Colors.info + '30',
  },
  iconContainer: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBackground: {
    backgroundColor: Colors.primary + '15',
  },
  errorBackground: {
    backgroundColor: Colors.error + '15',
  },
  infoBackground: {
    backgroundColor: Colors.info + '15',
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  titleText: {
    color: Colors.white,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  messageText: {
    color: Colors.gray300,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
});

export default CustomToast;
