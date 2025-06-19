import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/apiConfig';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = () => {
  const navigation = useNavigation();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
console.log(AuthSession.makeRedirectUri({ useProxy: true }));

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '1063343671815-kndgshsgcabd9epjq9i1jo25h2a2nebt.apps.googleusercontent.com',
    androidClientId: '1063343671815-d2jdtgs4madb6fmg2lpkh9fuhanggskp.apps.googleusercontent.com',
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),

  });
  console.log(AuthSession.makeRedirectUri({ useProxy: true }));
  console.log(AuthSession.makeRedirectUri({ useProxy: true }));


useEffect(() => {
  if (response?.type === 'success') {
    const idToken = response.authentication?.idToken;
    if (idToken) {
      handleGoogleLogin(idToken);
    } else {
      Alert.alert('Error', 'Google authentication failed. No token found.');
    }
  } else if (response?.type === 'error') {
    Alert.alert('Google Auth Error', response.error);
  }
}, [response]);


const handleGoogleLogin = async (idToken) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/auth/google-login`, {
      idToken,
    });

    if (res.data.success) {
      const user = res.data.user || {};
      const storagePairs = Object.entries(user).map(([key, value]) => [
        key,
        typeof value === 'object' ? JSON.stringify(value) : String(value),
      ]);
      await AsyncStorage.multiSet(storagePairs);
      Alert.alert('Login Success', res.data.message);
      clearFields();
      navigation.navigate('HomePage');
    } else {
      Alert.alert('Login Failed', res.data.message || 'Google login failed');
    }
  } catch (error) {
    console.error('Google login error:', error?.response?.data || error.message);
    Alert.alert('Error', error?.response?.data?.message || error.message);
  }
};



  const fetchGoogleUserInfo = async (token) => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userInfo = await res.json();
      await AsyncStorage.setItem('user', JSON.stringify(userInfo));
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch user information');
    }
  };

  const validateForm = () => {
    console.log('Validating form...');
    if (!email || !password || (isSignup && (!username || !confirmPassword))) {
      console.warn('Validation failed: Missing fields');
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    if (isSignup && password !== confirmPassword) {
      console.warn('Validation failed: Passwords do not match');
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

const clearFields = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async () => {
    console.log(isSignup ? 'Signup form submitted' : 'Login form submitted');
    if (!validateForm()) return;

    try {
      if (isSignup) {
        console.log('Sending signup request to:', `${API_BASE_URL}/api/auth/send-otp`);
        const res = await axios.post(`${API_BASE_URL}/api/auth/send-otp`, {
          email,
          username,
          password,
        });

        console.log('Signup response:', res.data);
        if (res.data.success) {
          await AsyncStorage.multiSet([
            ['email', email],
            ['username', username],
          ]);
          Alert.alert('Success', res.data.message);
          clearFields();
          navigation.navigate('OtpVerification', { email });
        }
      } else {
        console.log('Sending login request to:', `${API_BASE_URL}/api/auth/login`);
        const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email,
          password,
        });

        console.log('Login response:', res.data);
        if (res.data.success) {
          const user = res.data.user || {};
          const storagePairs = Object.entries(user).map(([key, value]) => [
            key,
            typeof value === 'object' ? JSON.stringify(value) : String(value),
          ]);
          await AsyncStorage.multiSet(storagePairs);
          Alert.alert('Login Success', res.data.message);
          clearFields();
          navigation.navigate('HomePage');
        }
      }
    } catch (err) {
      console.error('Auth error:', err?.response?.data || err.message);
      Alert.alert('Error', err?.response?.data?.message || err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.container}>
            <Text style={styles.title}>{isSignup ? 'Sign Up' : 'Login'}</Text>

            <TextInput
              placeholder="Email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {isSignup && (
              <TextInput
                placeholder="Username"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            )}

            <TextInput
              placeholder="Password"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />

            {isSignup && (
              <TextInput
                placeholder="Confirm Password"
                secureTextEntry
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            )}

            <TouchableOpacity onPress={handleSubmit} style={styles.button}>
              <Text style={styles.buttonText}>{isSignup ? 'Sign Up' : 'Login'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              console.log('Toggling signup/login mode');
              setIsSignup(!isSignup);
            }}>
              <Text style={styles.toggleText}>
                {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>

           <TouchableOpacity
  onPress={async () => {
    try {
      console.log('Prompting Google login...');
      await promptAsync();
    } catch (err) {
      console.error('Google login error:', err);
      Alert.alert('Login Error', err.message || 'Something went wrong');
    }
  }}
  style={styles.googleButton}
>
  <Text style={styles.buttonText}>Continue with Google</Text>
</TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthScreen;
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  container: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 60,
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#1D4ED8',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#60A5FA',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  googleButton: {
    backgroundColor: '#DB4437',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  toggleText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#1E3A8A',
    fontSize: 14,
  },
});
