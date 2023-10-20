import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Button } from 'react-native';
import { urlFor } from '../../sanity';
import TaleContent from '../components/Content/TaleContent';
import HeaderNavbar from '../components/Content/HeaderNavbar';
import TopNavbar from '../components/Content/TopNavbar';
import { Colors } from '../constants/colors';
import useGetTale from '../hooks/useGetTale';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import { Rating } from 'react-native-ratings';
import { firestore } from '../../firebaseConfig';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore'; // Import from 'firebase/firestore'
import { AuthContext } from '../store/AuthContext';

const Content = ({ route }) => {
  const { slug } = route.params;
  const { userInfo } = useContext(AuthContext);
  const { loading, error, tale, setTale, setLoading, setError } = useGetTale(slug);
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  console.log('USER INFO =>', userInfo.uid);

  const saveRating = async () => {
    try {
      await addDoc(collection(firestore, 'taleRatings'), {
        taleId: tale[0]._id,
        taleTitle: tale[0].title,
        rating: rating,
        userId: userInfo.uid, // add the user ID to the document
        timestamp: new Date(),
      });
      console.log('Rating saved successfully!');
      setHasRated(true); // set hasRated to true after saving the rating
    } catch (error) {
      console.error('Error saving rating: ', error);
    }
  };

  if (loading) return <LoadingAnimation />;
  if (error) return <ErrorAnimation />;
  if (!tale || !tale[0]) return null;
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
          <View style={styles.content}>
            <Text style={styles.title}>{tale[0]?.title}</Text>
            <View style={styles.infoContainer}>
              <Text style={styles.author}>Author: {tale[0].author}</Text>
              <Text style={styles.category}>Category: {tale[0].category}</Text>
            </View>
            <TaleContent style={styles.blocks} blocks={tale[0].content} />
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingTitle}>Rate this book:</Text>
              <Rating
                type="star"
                ratingCount={5}
                imageSize={30}
                startingValue={rating}
                onFinishRating={setRating}
                ratingBackgroundColor={Colors.dark900}
                tintColor={Colors.dark900}
              />
              <Button title="Save Rating" onPress={saveRating} />
            </View>
          </View>
        </ParallaxScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  headerImage: {
    height: 300,
    width: '100%',
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 10,
  },
  infoContainer: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  author: {
    fontSize: 16,
    color: Colors.white,
  },
  category: {
    fontSize: 16,
    color: Colors.white,
  },
  likeContainer: {
    flexDirection: 'row',
  },
  likeCount: {
    fontSize: 16,
    color: Colors.white,
    marginLeft: 10,
  },
  ratingContainer: {
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: Colors.dark900,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 10,
  },
});

export default Content;
