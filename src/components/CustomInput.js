import { View, TextInput, Dimensions, StyleSheet } from 'react-native';
import Icon from './Icons';

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

export default CustomInput;

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.8,
    height: height * 0.06,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
  },
  input: {
    flex: 1,
    paddingLeft: width * 0.02,
    color: 'white',
  },
  icon: {
    marginRight: 10,
  },
});
