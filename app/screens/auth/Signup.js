import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Formik } from 'formik';
import { signupValidationSchema } from '../../components/Auth/Validation';

const Login = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Account</Text>
      <View style={styles.formContainer}>
        <Formik
          initialValues={{ firstName: '', lastName: '', email: '', password: '' }}
          onSubmit={(values) => console.log(values)}
          validationSchema={signupValidationSchema}
        >
          {({ handleChange, handleBlur, handleSubmit, values }) => (
            <View>
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
              />
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </View>
      <View style={styles.signupContainer}>
        <Text style={styles.signupInfo}>Do you have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.signupText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    padding: 5,
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: 290,
    height: 290,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 40,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 52,
    textAlign: 'center',
  },
  formContainer: {
    marginHorizontal: 20,
    padding: 20,
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
