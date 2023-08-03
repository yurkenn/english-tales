import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';
import { BookmarkIcon } from '../../UI/SvgIcons';

const FeaturedStories = ({ data }) => {
  const { title, author, bookmarks, category, content, imageUrl, likes, timestamp } = data;
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <TouchableOpacity style={styles.button}>
          <BookmarkIcon />
        </TouchableOpacity>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <View style={styles.authorContainer}>
          <Text style={styles.author}>{author}</Text>
        </View>
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.category}>{category}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.likes}>{likes}</Text>
        <Text style={styles.bookmarks}>{bookmarks}</Text>
      </View>
    </View>
  );
};

export default FeaturedStories;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    marginHorizontal: 10,
    padding: 10,
    width: 300,
    height: 270,
  },

  imageContainer: {
    position: 'relative',
  },
  button: {
    backgroundColor: '#000000',
    flex: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    height: 32,
    width: 32,
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
  },

  image: {
    borderRadius: 10,
    height: 150,
    width: '100%',
  },
  authorContainer: {
    backgroundColor: Colors.primaryBackground,
    borderRadius: 6,
    height: 30,
    bottom: 10,
    left: 10,
    padding: 5,
    position: 'absolute',
  },
  author: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleContainer: {
    marginVertical: 10,
  },
  title: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  category: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  likes: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookmarks: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
