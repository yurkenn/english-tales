import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import Icon from '../Icons';

const CategoryCard = ({ data }) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Detail', { data })} activeOpacity={0.7}>
      <LinearGradient
        colors={['#1F1F1F', '#121212']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <Animated.Image source={{ uri: data?.imageURL }} style={styles.image} />

        <View style={styles.contentContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {data?.title}
          </Text>

          <Text style={styles.description} numberOfLines={3}>
            {data?.description}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Icon name="time" size={16} color={Colors.white} />
              <Text style={styles.statText}>{data?.readTime}m</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="heart" size={16} color={Colors.red} />
              <Text style={styles.statText}>{data?.likes}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: windowHeight * 0.02,
    padding: windowWidth * 0.03,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: windowWidth * 0.25,
    height: windowHeight * 0.15,
    borderRadius: 8,
  },
  contentContainer: {
    flex: 1,
    marginLeft: windowWidth * 0.03,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: windowHeight * 0.022,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: windowHeight * 0.01,
  },
  description: {
    fontSize: windowHeight * 0.016,
    color: Colors.gray,
    lineHeight: windowHeight * 0.022,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: windowHeight * 0.01,
    gap: windowWidth * 0.04,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: windowWidth * 0.01,
  },
  statText: {
    color: Colors.white,
    fontSize: windowHeight * 0.016,
  },
});

export default CategoryCard;
