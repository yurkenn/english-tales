import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Formik } from 'formik';
import { signupValidationSchema } from '../../components/Auth/Validation';
import SignupAnimation from '../../components/Animations/SignupAnimation';
import { useContext } from 'react';
import { AuthContext } from '../../store/auth-context';

const SignUp = ({ navigation }) => {
  const authContext = useContext(AuthContext);

  const handleSignUp = async (values) => {
    authContext.createUser(values);
  };

  return (
    <View style={styles.container}>
      <View style={styles.animation}>
        <SignupAnimation />
      </View>

      <Formik
        initialValues={{ firstName: '', lastName: '', email: '', password: '' }}
        onSubmit={handleSignUp}
        validationSchema={signupValidationSchema}
      >
        {({ handleChange, handleBlur, handleSubmit, values }) => (
          <View style={styles.inner_container}>
            <Text style={styles.title}>Sign Up</Text>
            <View style={styles.nameContainer}>
              <TextInput
                style={styles.firstNameInput}
                placeholder="First name*"
                placeholderTextColor="#fff"
                onChangeText={handleChange('firstName')}
                onBlur={handleBlur('firstName')}
                value={values.firstName}
              />
              <TextInput
                style={styles.lastNameInput}
                placeholder="Last name*"
                placeholderTextColor="#fff"
                onChangeText={handleChange('lastName')}
                onBlur={handleBlur('lastName')}
                value={values.lastName}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email address*"
              placeholderTextColor="#fff"
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              value={values.email}
            />
            <TextInput
              style={styles.input}
              placeholder="Password*"
              placeholderTextColor="#fff"
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              value={values.password}
              secureTextEntry
            />
            <TouchableOpacity onPress={handleSubmit} style={styles.button}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
            <View style={styles.signupContainer}>
              <Text style={styles.signupInfo}>Do you have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signupText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Formik>
    </View>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    bottom: 550,
  },
  inner_container: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 50,
  },
  title: {
    fontSize: 40,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 52,
    textAlign: 'center',
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    marginTop: 10,
    width: 311,
    height: 48,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    backgroundColor: '#161616',
    color: '#bdbdbd',
    fontSize: 14,
    lineHeight: 19,
  },
  button: {
    width: 311,
    height: 48,
    marginTop: 20,
    backgroundColor: '#000000',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
  },
  infoText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
    fontWeight: '300',
    marginTop: 10,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupInfo: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    marginRight: 5,
  },
  signupText: {
    color: 'orange',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  firstNameInput: {
    marginTop: 10,
    width: 120,
    height: 48,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    backgroundColor: '#161616',
    color: '#bdbdbd',
    fontSize: 14,
    lineHeight: 19,
  },
  lastNameInput: {
    marginTop: 10,
    width: 160,
    height: 48,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    backgroundColor: '#161616',
    color: '#bdbdbd',
    fontSize: 14,
    lineHeight: 19,
  },
});
