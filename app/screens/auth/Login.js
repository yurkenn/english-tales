import {
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

WebBrowser.maybeCompleteAuthSession();

const Login = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const promptAsync = authContext.promptAsync;

  const [focusedInput, setFocusedInput] = useState(null);

  const handleSubmit = async (values) => {
    authContext.handleLogin(values);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={require('../../../assets/images/login.png')} style={styles.image} />
        <Text style={styles.title}>English Tales</Text>

        <Formik
          initialValues={{ email: '', password: '' }}
          onSubmit={handleSubmit}
          validationSchema={loginValidationSchema}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors }) => (
            <View style={styles.inner_container}>
              <Text style={styles.subtitle}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={Colors.white}
                onChangeText={handleChange('email')}
                onBlur={() => {
                  setFocusedInput(null);
                  handleBlur('email');
                }}
                onFocus={() => setFocusedInput('email')}
                value={values.email}
                autoCapitalize="none"
              />
              {errors.email && focusedInput === 'email' && (
                <Text style={styles.errors}>{errors.email}</Text>
              )}
              <Text style={styles.subtitle}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.white}
                onChangeText={handleChange('password')}
                onBlur={() => {
                  setFocusedInput(null);
                  handleBlur('password');
                }}
                value={values.password}
                secureTextEntry
                onFocus={() => setFocusedInput('password')}
              />
              {errors.password && focusedInput === 'password' && (
                <Text style={styles.errors}>{errors.password}</Text>
              )}
              <TouchableOpacity onPress={handleSubmit} style={styles.button}>
                <Text style={styles.buttonText}>Log In</Text>
              </TouchableOpacity>
              <View>
                <Text style={styles.infoText}>Forgot password?</Text>
              </View>
              <View style={styles.orContainer}>
                <View style={styles.line} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.line} />
              </View>
              <TouchableOpacity onPress={() => promptAsync()} style={styles.googleButton}>
                <Image
                  source={require('../../../assets/images/google.png')}
                  style={styles.googleIcon}
                />
                <Text style={styles.buttonText}>Continue with Google</Text>
              </TouchableOpacity>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    flex: 1,
    alignSelf: 'center',
    marginTop: 30,
    width: 250,
    height: 250,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 40,
    fontWeight: '600',
    color: Colors.white,
    lineHeight: 52,
    textAlign: 'center',
  },
  inner_container: {
    flex: 1,
  },
  subtitle: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    width: 311,
    height: 48,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    backgroundColor: Colors.dark900,
    color: '#bdbdbd',
    fontSize: 14,
    lineHeight: 19,
  },
  button: {
    width: 311,
    height: 48,
    padding: 8,
    marginTop: 20,
    backgroundColor: Colors.black,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: 'bold',
  },
  infoText: {
    color: Colors.white,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
    fontWeight: '300',
    marginTop: 10,
  },

  orContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  line: {
    width: 135,
    borderWidth: 0.5,
    borderColor: Colors.white,
  },
  orText: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },

  googleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: Colors.black,
    borderRadius: 6,
    padding: 8,
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
    fontSize: 14,
    lineHeight: 18,
    marginRight: 5,
  },
  signupText: {
    color: '#FFA500',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: 'bold',
  },
  errors: {
    fontSize: 14,
    color: 'red',
    marginTop: 3,
    fontWeight: 'normal',
  },
});
