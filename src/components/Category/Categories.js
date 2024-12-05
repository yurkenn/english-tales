import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Image } from 'react-native';
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

const { width, height } = Dimensions.get('window');
const buttonSize = width * 0.25;

const styles = StyleSheet.create({
  container: {
    margin: width * 0.02,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: buttonSize,
    height: buttonSize,
    borderRadius: 12,
    padding: width * 0.02,
    gap: height * 0.01,
  },
  icon: {
    height: buttonSize * 0.4,
    width: buttonSize * 0.4,
    resizeMode: 'contain',
  },
  categoryName: {
    color: Colors.white,
    fontSize: width * 0.034,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Categories;
