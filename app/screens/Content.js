import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { urlFor } from '../../sanity';
import TaleContent from '../components/Content/TaleContent';
import HeaderNavbar from '../components/Content/HeaderNavbar';
import TopNavbar from '../components/Content/TopNavbar';
import { Colors } from '../constants/colors';
import useGetTale from '../hooks/useGetTale';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import Icon from '../UI/Icons';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import { setLikes } from '../utils/sanity-utils';

const Content = ({ route }) => {
  const { slug } = route.params;
  console.log('DATA: ', slug);

  const { loading, error, tale } = useGetTale(slug);
  console.log('TALE: ', tale);

  // State for tracking like and bookmark status
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(tale[0]?.likes);

  // Function to handle liking
  const handleLike = async () => {
    // Toggle like status
    setIsLiked(!isLiked);

    // Implement logic to save the like to the database
    try {
      const updatedLikes = await setLikes(tale[0].slug.current, likeCount + 1);
      setLikeCount(updatedLikes);
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  // Function to handle bookmarking
  const handleBookmark = () => {
    // Toggle bookmark status
    setIsBookmarked(!isBookmarked);

    // Implement logic to save the story to bookmarks
  };

  if (loading) return <LoadingAnimation />;
  if (error) return <ErrorAnimation />;

  return (
    <View style={styles.container}>
      {tale && (
        <ParallaxScrollView
          style={{ flex: 1, overflow: 'hidden' }}
          backgroundColor={Colors.dark900}
          contentBackgroundColor={Colors.dark900}
          parallaxHeaderHeight={300}
          renderForeground={() => (
            <Image source={{ uri: urlFor(tale[0].imageURL).url() }} style={styles.headerImage} />
          )}
          stickyHeaderHeight={80}
          renderFixedHeader={() => <HeaderNavbar title={tale[0].title} />}
          renderStickyHeader={() => <TopNavbar title={tale[0].title} />}
        >
          {/* Content */}
          <View style={styles.content}>
            <TaleContent style={styles.blocks} blocks={tale[0].content} />
          </View>

          {/* Like and Bookmark Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              disabled={isLiked ? true : false}
              style={styles.button}
              onPress={handleLike}
            >
              <Icon
                name={isLiked ? 'heart' : 'heart-outline'}
                size={23}
                color={isLiked ? Colors.red : Colors.white}
              />
              <Text style={styles.buttonText}>{isLiked ? 'Liked' : 'Like'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleBookmark}>
              <Icon
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={23}
                color={isBookmarked ? Colors.yellow : Colors.white}
              />
              <Text style={styles.buttonText}>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</Text>
            </TouchableOpacity>
          </View>
        </ParallaxScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  infoContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  author: {
    fontSize: 16,
    color: Colors.gray,
    paddingBottom: 5,
  },
  category: {
    fontSize: 16,
    color: Colors.gray,
    paddingBottom: 5,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    fontSize: 14,
    color: Colors.red,
    marginLeft: 5,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  headerImage: {
    height: 300,
    width: '100%',
    opacity: 0.8,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    backgroundColor: Colors.black,
    borderRadius: 5,
    padding: 10,
  },
  buttonText: {
    color: Colors.white,
    marginLeft: 5,
  },
});

export default Content;
