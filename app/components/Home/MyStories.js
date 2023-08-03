import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';

const MyStories = () => {
  const data = {
    title: 'The Last of Us',
    author: 'Neil Druckmann',
    lastRead: '2 hours ago',
    imageUrl:
      'https://images.unsplash.com/photo-1546198633-5fcfa755b3b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
  };
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: data.imageUrl }} style={styles.image} />
      </View>
      <View style={styles.infoContainer}>
        <View>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.author}>{data.author}</Text>
        </View>
        <View>
          <Text style={styles.lastRead}>{data.lastRead}</Text>
        </View>
      </View>
    </View>
  );
};

export default MyStories;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#282828',
    borderRadius: 6,
    marginBottom: 10,
    marginTop: 10,
    padding: 10,
  },
  imageContainer: {
    flex: 1.5,
  },
  image: {
    height: 136,
    width: 128,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  infoContainer: {
    flex: 2,
    justifyContent: 'space-between',
    marginLeft: 25,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  author: {
    marginTop: 8,
    color: '#fff',
    fontSize: 14,
    lineHeight: 16,
  },
  lastRead: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 14,
  },
});
