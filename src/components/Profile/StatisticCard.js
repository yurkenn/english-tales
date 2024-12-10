import { StyleSheet, Text, View } from 'react-native';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import {
  scale,
  verticalScale,
  spacing,
  fontSizes,
  wp,
  isSmallDevice,
} from '../../utils/dimensions';

const StatisticCard = ({ icon, value, label }) => (
  <LinearGradient
    colors={[Colors.dark500, Colors.dark900]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.card}
  >
    <View style={styles.iconContainer}>
      <Icon name={icon} size={scale(24)} color={Colors.primary} />
    </View>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </LinearGradient>
);

const styles = StyleSheet.create({
  card: {
    width: (wp(100) - spacing.lg * 3) / 2, // Accounts for container padding and gap
    borderRadius: scale(15),
    padding: spacing.lg,
    alignItems: 'center',
    // Add shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: scale(45),
    height: scale(45),
    borderRadius: scale(22.5),
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  value: {
    fontSize: isSmallDevice ? fontSizes.xl : fontSizes.xxl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: verticalScale(4),
  },
  label: {
    fontSize: fontSizes.sm,
    color: Colors.gray500,
    textAlign: 'center',
  },
});

export default StatisticCard;
