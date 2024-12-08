import React from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const Categories = ({ data, index }) => {
  const navigation = useNavigation();

  return (
    <Animated.View entering={FadeInDown.springify().delay(index * 100)} style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.navigate('CategoryList', { category: data?.title })}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#1F1F1F', '#121212']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Image source={{ uri: data?.icon }} style={styles.icon} />
          <Text style={styles.categoryName} numberOfLines={2}>
            {data?.title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = SCREEN_WIDTH * 0.25;

const styles = StyleSheet.create({
  container: {
    margin: SCREEN_WIDTH * 0.02,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 12,
    padding: SCREEN_WIDTH * 0.02,
    gap: SCREEN_HEIGHT * 0.01,
  },
  icon: {
    height: BUTTON_SIZE * 0.4,
    width: BUTTON_SIZE * 0.4,
    resizeMode: 'contain',
  },
  categoryName: {
    color: Colors.white,
    fontSize: SCREEN_WIDTH * 0.034,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Categories;
