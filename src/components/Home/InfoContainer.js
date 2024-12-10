import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';
import { wp, hp, isSmallDevice } from '../../utils/dimensions';

const StatItem = ({ icon, value, color = Colors.white }) => (
  <Animated.View entering={FadeIn} style={styles.statContainer}>
    <Icon name={icon} size={isSmallDevice ? wp(4) : wp(5)} color={color} />
    <Text style={styles.statText}>{value}</Text>
  </Animated.View>
);

const InfoContainer = ({ readTime, likes }) => {
  return (
    <View style={styles.container}>
      <StatItem icon="time-outline" value={readTime} />
      <View style={styles.divider} />
      <StatItem icon="heart" value={likes} color={Colors.red} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: wp(1),
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.7),
  },
  statText: {
    color: Colors.white,
    fontSize: isSmallDevice ? wp(3) : wp(3.5),
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: isSmallDevice ? hp(1.5) : hp(2),
    backgroundColor: Colors.white,
    opacity: 0.2,
    marginHorizontal: wp(2),
  },
});

export default InfoContainer;
