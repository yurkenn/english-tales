import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Formik } from 'formik';
import { loginValidationSchema } from '../../components/Auth/Validation';
import { AuthContext } from '../../store/AuthContext';
import { useContext, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../../constants/colors';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icons';
import CustomInput from '../../components/CustomInput';

WebBrowser.maybeCompleteAuthSession();

const Login = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const promptAsync = authContext.promptAsync;

  const [focusedInput, setFocusedInput] = useState(null);

  const handleSubmit = async (values) => {
    authContext.handleLogin(values);
  };

  //TODO: Forgot password
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={require('../../../assets/images/login-image.png')} style={styles.image} />
        <Text style={styles.title}>Learn English with Tales</Text>

        <Formik
          initialValues={{ email: '', password: '' }}
          onSubmit={handleSubmit}
          validationSchema={loginValidationSchema}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors }) => (
            <View style={styles.inner_container}>
              <Text style={styles.subtitle}>Email</Text>
              <CustomInput
                placeholder="Enter your email"
                onChangeText={handleChange('email')}
                value={values.email}
                icon="mail"
                onPress={() => {}}
                isSecure={false}
              />
              {errors.email && focusedInput === 'email' && (
                <Text style={styles.errors}>{errors.email}</Text>
              )}
              <Text style={styles.subtitle}>Password</Text>
              <CustomInput
                placeholder="Enter your password"
                onChangeText={handleChange('password')}
                value={values.password}
                icon="lock-closed"
                onPress={() => {}}
                isSecure={true}
              />
              {errors.password && focusedInput === 'password' && (
                <Text style={styles.errors}>{errors.password}</Text>
              )}
              <CustomButton
                onPress={handleSubmit}
                title="Log In"
                style={styles.button}
                textStyle={styles.buttonText}
              />
              {/* <View>
                <Text style={styles.infoText}>Forgot password?</Text>
              </View> */}
              <View style={styles.orContainer}>
                <View style={styles.line} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.line} />
              </View>
              <CustomButton
                onPress={() => promptAsync()}
                title="Continue with Google"
                style={styles.googleButton}
                textStyle={styles.buttonText}
                imageSource={require('../../../assets/images/google.png')}
                imageStyle={styles.googleIcon}
              />
              <View style={styles.signupContainer}>
                <Text style={styles.signupInfo}>Don't you have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                  <Text style={styles.signupText}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: windowWidth * 0.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: windowWidth * 0.8,
    height: windowHeight * 0.31,
    resizeMode: 'contain',
  },
  title: {
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
  inner_container: {
    flex: 1,
  },
  subtitle: {
    color: Colors.white,
    fontSize: windowHeight * 0.02,
    lineHeight: 18,
    marginTop: windowHeight * 0.02,
    marginBottom: windowHeight * 0.01,
  },
  button: {
    width: windowWidth * 0.8, // Use the same width for all buttons
    height: windowHeight * 0.06,
    padding: windowWidth * 0.02,
    marginTop: windowHeight * 0.02,
    backgroundColor: Colors.black,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: windowHeight * 0.018,
    lineHeight: 16,
    fontWeight: 'bold',
  },
  infoText: {
    color: Colors.white,
    fontSize: windowHeight * 0.016,
    lineHeight: 16,
    textAlign: 'right',
    fontWeight: '300',
    marginTop: windowHeight * 0.02,
  },

  orContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: windowHeight * 0.022,
  },
  line: {
    width: windowWidth * 0.3,
    borderWidth: 0.5,
    borderColor: Colors.white,
  },
  orText: {
    color: Colors.white,
    fontSize: windowHeight * 0.018,
    lineHeight: 18,
    fontWeight: 'bold',
    marginHorizontal: windowWidth * 0.022,
  },
  googleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: windowHeight * 0.06,
    marginTop: windowHeight * 0.02,
    width: windowWidth * 0.8, // Use the same width for Google button
    backgroundColor: Colors.black,
    borderRadius: 6,
    padding: windowWidth * 0.02,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  signupInfo: {
    color: Colors.white,
    fontSize: windowHeight * 0.016,
    lineHeight: 18,
    marginRight: 5,
  },
  signupText: {
    color: '#FFA500',
    fontSize: windowHeight * 0.02,
    lineHeight: 18,
    fontWeight: 'bold',
  },
  errors: {
    fontSize: windowHeight * 0.018,
    color: 'red',
    marginTop: windowHeight * 0.003,
    fontWeight: 'normal',
  },
});
