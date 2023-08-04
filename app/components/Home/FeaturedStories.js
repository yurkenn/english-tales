import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';
import { BookmarkOutlineIcon, LikeIcon } from '../../UI/Icons';
import { BookmarkIcon } from '../../UI/SvgIcons';
import { useNavigation } from '@react-navigation/native';
import BookmarkButton from '../../UI/BookmarkButton';

const FeaturedStories = ({ data }) => {
  const navigation = useNavigation();
  const { title, author, bookmarks, category, content, imageUrl, likes, timestamp } = data;

  const handleReadButton = () => {
    navigation.navigate('Content', { data });
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <BookmarkButton />
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
        <View style={styles.likeContainer}>
          <LikeIcon />
          <Text style={styles.likes}>{likes}</Text>
        </View>
        <View style={styles.bookmarkContainer}>
          <BookmarkOutlineIcon />
          <Text style={styles.bookmarks}>{bookmarks}</Text>
        </View>
        <View style={styles.readButtonContainer}>
          <TouchableOpacity onPress={handleReadButton} style={styles.readButton}>
            <Text style={styles.readButtonText}>Read</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default FeaturedStories;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    marginHorizontal: 10,
    padding: 10,
  },

  imageContainer: {
    position: 'relative',
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
    alignItems: 'center',
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  likes: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  readButtonContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  readButton: {
    backgroundColor: Colors.primaryBackground,
    borderRadius: 6,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  readButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
  },
  bookmarks: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
