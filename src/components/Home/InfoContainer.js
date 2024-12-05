import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';
import { useState } from 'react';

const StatItem = ({ icon, value, color = Colors.white }) => (
  <Animated.View entering={FadeIn} style={styles.statContainer}>
    <Icon name={icon} size={20} color={color} />
    <Text style={styles.statText}>{value}</Text>
  </Animated.View>
);

const InfoContainer = ({ readTime, likes }) => {
  const [pressed, setPressed] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed ? 0.95 : 1) }],
  }));

  return (
    <Pressable onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <LinearGradient
          colors={[Colors.dark500 + '80', Colors.dark900 + '80']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glassEffect}
        >
          <StatItem icon="time-outline" value={readTime} />
          <View style={styles.divider} />
          <StatItem icon="heart" value={likes} color={Colors.red} />
        </LinearGradient>

        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.shine}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
  },
  glassEffect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.white,
    opacity: 0.2,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    opacity: 0.5,
  },
});

export default InfoContainer;
