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
import { signupValidationSchema } from '../../components/Auth/Validation';
import { AuthContext } from '../../store/AuthContext';
import { useContext, useState } from 'react';
import SignupAnimation from '../../components/Animations/SignupAnimation';
import { Colors } from '../../constants/colors';
import CustomButton from '../../components/CustomButton';

const Signup = ({ navigation }) => {
  const [focusedInput, setFocusedInput] = useState(null);

  const authContext = useContext(AuthContext);

  const handleSubmit = async (values) => {
    authContext.createUser(values);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.animation}>
          <SignupAnimation />
        </View>
        <View>
          <Text style={styles.title}>Create your account</Text>
        </View>

        <Formik
          initialValues={{ email: '', password: '', firstName: '', lastName: '' }}
          onSubmit={(values) => handleSubmit(values)}
          validationSchema={signupValidationSchema}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors }) => (
            <View style={styles.inner_container}>
              <View style={styles.nameContainer}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="First Name"
                  placeholderTextColor={Colors.white}
                  onChangeText={handleChange('firstName')}
                  onBlur={() => {
                    setFocusedInput(null);
                    handleBlur('firstName');
                  }}
                  onFocus={() => setFocusedInput('firstName')}
                  value={values.firstName}
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.lastNameInput}
                  placeholder="Last Name"
                  placeholderTextColor={Colors.white}
                  onChangeText={handleChange('lastName')}
                  onBlur={() => {
                    setFocusedInput(null);
                    handleBlur('lastName');
                  }}
                  onFocus={() => setFocusedInput('lastName')}
                  value={values.lastName}
                  autoCapitalize="none"
                />
              </View>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  padding: 5,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    paddingLeft: 25,
                  }}
                >
                  {focusedInput === 'firstName' && errors.firstName && (
                    <Text style={styles.errors}>{errors.firstName}</Text>
                  )}
                </View>
                <View
                  style={{
                    flex: 1,
                    paddingRight: 5,
                  }}
                >
                  {focusedInput === 'lastName' && errors.lastName && (
                    <Text style={styles.errors}>{errors.lastName}</Text>
                  )}
                </View>
              </View>
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
              {focusedInput === 'email' && errors.email && (
                <Text style={styles.errors}>{errors.email}</Text>
              )}

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.white}
                onChangeText={handleChange('password')}
                onBlur={() => {
                  setFocusedInput(null);
                  handleBlur('password');
                }}
                onFocus={() => setFocusedInput('password')}
                value={values.password}
                secureTextEntry
              />
              {focusedInput === 'password' && errors.password && (
                <Text style={styles.errors}>{errors.password}</Text>
              )}
              <CustomButton
                onPress={handleSubmit}
                title="Sign Up"
                style={styles.button}
                textStyle={styles.buttonText}
              />

              <View style={styles.signupContainer}>
                <Text style={styles.signupInfo}>Do you have already an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signupText}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Signup;

const { width } = Dimensions.get('window');

const inputWidth = width * 0.8; // 80% of screen width
const buttonWidth = width * 0.8; // 80% of screen width
const titleFontSize = width < 400 ? 36 : 40;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  animation: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: titleFontSize,
    fontWeight: '600',
    color: Colors.white,
    lineHeight: 52,
    textAlign: 'center',
    marginBottom: 20,
  },
  inner_container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: inputWidth,
  },
  nameInput: {
    width: (inputWidth - 20) / 2,
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
  lastNameInput: {
    width: (inputWidth - 20) / 2,
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

  input: {
    width: inputWidth,
    height: 48,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    backgroundColor: Colors.dark900,
    color: '#bdbdbd',
    fontSize: 14,
    lineHeight: 19,
    marginTop: 20,
  },
  button: {
    width: buttonWidth,
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
