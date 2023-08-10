import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';
import { BookmarkOutlineIcon, LikeIcon } from '../../UI/Icons';
import { useNavigation } from '@react-navigation/native';
import BookmarkButton from '../../UI/BookmarkButton';
import { urlFor } from '../../../sanity';

const FeaturedStories = ({ data }) => {
  const navigation = useNavigation();

  const handleReadButton = () => {
    navigation.navigate('Content', { slug: data.tales[0].slug.current });
  };

  const dateString = data.tales[0].publishedAt;
  const formattedDate = new Date(dateString).toLocaleDateString();

  return (
    <View>
      {data && (
        <View style={styles.container}>
          <View style={styles.imageContainer}>
            <BookmarkButton />
            <Image source={{ uri: urlFor(data.imageURL).url() }} style={styles.image} />
            <View style={styles.authorContainer}>
              <Text style={styles.author}>{data.tales[0].author}</Text>
            </View>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.category}>{data.tales[0].category}</Text>
          </View>
          <View style={styles.infoContainer}>
            <View style={styles.likeContainer}>
              <LikeIcon />
              <Text style={styles.likes}>{data.tales[0].likes}</Text>
            </View>
            <View style={styles.bookmarkContainer}>
              <Text style={styles.bookmarks}>{formattedDate}</Text>
            </View>
            <View style={styles.readButtonContainer}>
              <TouchableOpacity onPress={handleReadButton} style={styles.readButton}>
                <Text style={styles.readButtonText}>Read</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    width: 250,
    resizeMode: 'cover',
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
