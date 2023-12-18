import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import FormatReadTime from '../FormatReadTime';
import Icon from '../Icons';

const ContinueReading = ({ lastRead }) => {
  const navigation = useNavigation();

  const time = FormatReadTime(lastRead?.readTime);

  const handleGoTaleDetail = () => {
    navigation.navigate('Detail', { data: lastRead });
  };

  return (
    <TouchableOpacity onPress={handleGoTaleDetail}>
      {lastRead ? (
        <View style={styles.container}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: lastRead.imageURL }} style={styles.image} />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{lastRead.title}</Text>
            <View style={styles.timeContainer}>
              <Icon name="time-outline" size={16} color={Colors.white} />
              <Text style={styles.time}>{time}</Text>
              <View style={{ flexDirection: 'row', marginLeft: 10 }}>
                <Icon name="heart" size={16} color={Colors.red} />
                <Text style={styles.time}>{lastRead.likes}</Text>
              </View>
            </View>
            <View>
              <Text style={styles.lastRead}>{lastRead.description}</Text>
            </View>
          </View>
        </View>
      ) : (
        <Text style={styles.warningText}>You haven't read any tales yet. Go read some!</Text>
      )}
    </TouchableOpacity>
  );
};

export default ContinueReading;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.dark500,
    borderRadius: 6,
    marginBottom: 10,
    marginTop: 10,
    padding: 10,
  },
  imageContainer: {
    flex: 1.5,
  },
  image: {
    height: width * 0.36, // 30% of screen width
    width: width * 0.33, // 28% of screen width
    borderRadius: 6,
    resizeMode: 'cover',
  },
  infoContainer: {
    flex: 2,
    justifyContent: 'space-between',
    marginLeft: 25,
  },
  title: {
    color: Colors.white,
    fontSize: width < 400 ? 14 : 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    marginLeft: 5,
    fontWeight: 'bold',
    color: Colors.white,
    fontSize: 12,
    lineHeight: 16,
  },
  lastRead: {
    color: Colors.white,
    fontSize: width < 400 ? 10 : 12,
    fontWeight: '500',
    lineHeight: 14,
  },
  warningText: {
    margin: 10,
    color: Colors.white,
    fontSize: width < 400 ? 12 : 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
