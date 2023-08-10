import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import PortableText from 'react-portable-text';

const TaleContent = ({ blocks }) => {
  return (
    <View>
      <PortableText
        content={blocks}
        serializers={{
          h1: ({ children }) => <Text style={styles.h1}>{children}</Text>,
          li: ({ children }) => <Text style={styles.li}>{children}</Text>,
          p: ({ children }) => <Text style={styles.p}>{children}</Text>,
          normal: ({ children }) => <Text style={styles.normal}>{children}</Text>,
        }}
      />
    </View>
  );
};

export default TaleContent;

const styles = StyleSheet.create({
  h1: {},
  li: {},
  p: {},
  normal: {},
});
