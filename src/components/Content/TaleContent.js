import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import PortableText from 'react-portable-text';
import { Colors } from '../../constants/colors';
import { useFontSize } from '../../store/FontSizeContext';

const TaleContent = ({ blocks }) => {
  const { fontSize } = useFontSize();
  return (
    <View>
      <PortableText
        content={blocks}
        serializers={{
          h1: ({ children }) => <Text style={styles.h1}>{children}</Text>,
          li: ({ children }) => <Text style={styles.li}>{children}</Text>,
          p: ({ children }) => <Text style={styles.p}>{children}</Text>,
          normal: ({ children }) => (
            <Text
              style={{
                ...styles.normal,
                fontSize: parseInt(fontSize),
              }}
            >
              {children}
            </Text>
          ),
        }}
      />
    </View>
  );
};

export default TaleContent;

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
    fontSize: 18,
    color: Colors.white,
    paddingBottom: 10,
    letterSpacing: 0.5,
  },
});
