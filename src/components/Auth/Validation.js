// src/utils/validation.js
import * as yup from 'yup';

export const loginValidationSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required')
    .trim(),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
});

export const signupValidationSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required')
    .trim(),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
});
