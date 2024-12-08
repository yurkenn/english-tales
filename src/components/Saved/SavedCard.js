import React from 'react';
import { StyleSheet, Text, View, Dimensions, Pressable } from 'react-native';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideOutRight } from 'react-native-reanimated';
import Icon from '../Icons';

const SavedCard = ({ data, onDelete }) => {
  return (
    <Animated.View entering={FadeIn} exiting={SlideOutRight} style={styles.container}>
      <LinearGradient
        colors={['#282828', '#161616']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.Image
          source={{ uri: data?.imageURL }}
          style={styles.image}
          sharedTransitionTag={`image-${data?._id}`}
        />

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {data?.title}
          </Text>

          <Text style={styles.description} numberOfLines={2}>
            {data?.description}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Icon name="time-outline" size={16} color={Colors.white} />
              <Text style={styles.statText}>{data?.readTime}m</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="heart" size={16} color={Colors.error} />
              <Text style={styles.statText}>{data?.likes}</Text>
            </View>
            <Pressable
              onPress={() => onDelete(data)}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
            >
              <Icon name="trash-outline" size={20} color={Colors.error} />
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginBottom: windowHeight * 0.02,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    flexDirection: 'row',
    padding: windowWidth * 0.03,
  },
  image: {
    width: windowWidth * 0.25,
    height: windowHeight * 0.15,
    borderRadius: 8,
    backgroundColor: Colors.dark700,
  },
  content: {
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
    color: Colors.gray500,
    lineHeight: windowHeight * 0.022,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: windowHeight * 0.01,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: windowWidth * 0.04,
  },
  statText: {
    color: Colors.white,
    fontSize: windowHeight * 0.016,
    marginLeft: windowWidth * 0.01,
  },
  deleteButton: {
    marginLeft: 'auto',
    padding: windowWidth * 0.02,
    borderRadius: windowWidth * 0.02,
  },
  deleteButtonPressed: {
    backgroundColor: Colors.dark700 + '40',
  },
});

export default SavedCard;
