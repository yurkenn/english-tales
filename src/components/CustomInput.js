// src/components/CustomInput.js
import { View, TextInput, StyleSheet } from 'react-native';
import Icon from './Icons';
import { wp, hp, fontSizes, spacing, layout } from '../utils/dimensions';
import { Colors } from '../constants/colors';

const CustomInput = ({ placeholder, onChangeText, value, isSecure, icon, onPress, style }) => {
  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        secureTextEntry={isSecure}
        placeholderTextColor={'#d9d5d5'}
      />
      <Icon onPress={onPress} name={icon} size={20} color={'gray'} style={styles.icon} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: wp(80),
    height: hp(6),
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: layout.borderRadius,
  },
  input: {
    flex: 1,
    paddingLeft: spacing.md,
    color: Colors.white,
    fontSize: fontSizes.md,
  },
  icon: {
    marginRight: spacing.sm,
  },
});

export default CustomInput;
