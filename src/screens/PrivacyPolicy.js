import React from 'react';
import { ScrollView, Text, StyleSheet, View, Linking } from 'react-native';
import { Colors } from '../constants/colors';
import { scale, spacing, fontSizes } from '../utils/dimensions';
import Animated, { FadeInDown } from 'react-native-reanimated';

const PrivacyPolicy = () => {
  const sections = [
    {
      title: 'Data Collection',
      content: [
        'Authentication Data: Email address and display name for account creation and management',
        'Reading Activity: Story preferences, reading history, and bookmarks',
        'Usage Statistics: Time spent reading and story completion rates',
        'User Interactions: Likes and story ratings',
      ],
    },
    {
      title: 'Data Usage',
      content: [
        'Personalization: Customizing your reading experience and recommendations',
        'App Functionality: Managing your bookmarks, progress, and preferences',
        'Analytics: Improving app performance and content quality',
        'Authentication: Securing your account and syncing your data',
      ],
    },
    {
      title: 'Data Protection',
      content: [
        'Encryption: All personal data is encrypted during transmission',
        'Secure Storage: Data is securely stored using Firebase and Sanity.io',
        'Access Control: Your data is only accessible through your authenticated account',
        'Data Retention: You can request data deletion at any time',
      ],
    },
    {
      title: 'Device Data Collection',
      content: [
        'Device Identifiers: We collect device IDs for authentication and app functionality',
        'Installation ID: Used to maintain your app installation state',
        'Analytics Data: Anonymous usage data to improve app performance',
        'Authentication Tokens: Secure your sign in sessions',
      ],
    },
  ];

  const renderSection = (section, index) => (
    <Animated.View
      key={section.title}
      entering={FadeInDown.delay(index * 200)}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.content.map((item, idx) => (
        <View key={idx} style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.contentText}>{item}</Text>
        </View>
      ))}
    </Animated.View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.subtitle}>Last updated: December 12, 2024</Text>

      {sections.map((section, index) => renderSection(section, index))}

      <Text style={styles.footer}>
        For questions about our privacy policy, please contact us at:{'\n'}
        oguz.yurken@gmail.com
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xxxl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: Colors.gray300,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: spacing.md,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingRight: spacing.lg,
  },
  bullet: {
    color: Colors.primary,
    fontSize: fontSizes.md,
    marginRight: spacing.sm,
    marginTop: -2,
  },
  contentText: {
    flex: 1,
    fontSize: fontSizes.md,
    color: Colors.gray300,
    lineHeight: fontSizes.md * 1.5,
  },
  footer: {
    fontSize: fontSizes.sm,
    color: Colors.gray300,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
});

export default PrivacyPolicy;
