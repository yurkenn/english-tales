import React from 'react';
import { Animated, View, StyleSheet } from 'react-native';

const ParallaxScrollView = ({
  parallaxHeaderHeight,
  renderForeground,
  renderStickyHeader,
  stickyHeaderHeight,
  children,
  backgroundColor,
  contentBackgroundColor,
  style,
}) => {
  const scrollY = new Animated.Value(0);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, parallaxHeaderHeight - stickyHeaderHeight],
    outputRange: [0, -(parallaxHeaderHeight - stickyHeaderHeight)],
    extrapolate: 'clamp',
  });

  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [0, parallaxHeaderHeight - stickyHeaderHeight],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: parallaxHeaderHeight }}
      >
        {children}
      </Animated.ScrollView>

      <Animated.View
        style={[
          styles.parallaxHeader,
          {
            height: parallaxHeaderHeight,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        {renderForeground()}
      </Animated.View>

      <Animated.View
        style={[
          styles.stickyHeader,
          {
            height: stickyHeaderHeight,
            opacity: stickyHeaderOpacity,
          },
        ]}
      >
        {renderStickyHeader()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  parallaxHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
});

export default ParallaxScrollView;
