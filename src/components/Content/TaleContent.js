import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PortableText from 'react-portable-text';
import { Colors } from '../../constants/colors';
import { useFontSize } from '../../store/FontSizeContext';

const TaleContent = ({ blocks }) => {
  const { fontSize } = useFontSize();

  // Define serializers with modern syntax
  const serializers = {
    h1: ({ children }) => <Text style={styles.h1}>{children}</Text>,
    li: ({ children }) => <Text style={styles.li}>{children}</Text>,
    p: ({ children }) => <Text style={styles.p}>{children}</Text>,
    normal: ({ children }) => (
      <Text style={[styles.normal, { fontSize: parseInt(fontSize) }]}>{children}</Text>
    ),
  };

  return (
    <View>
      <PortableText
        content={blocks}
        serializers={serializers}
        // Use null instead of undefined for any props that might have been using defaultProps
        dataset={null}
        projectId={null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  li: {
    fontSize: 16,
    color: Colors.white,
  },
  p: {
    fontSize: 16,
    color: Colors.white,
  },
  normal: {
    color: Colors.white,
    paddingBottom: 10,
    letterSpacing: 0.5,
  },
});

export default TaleContent;
