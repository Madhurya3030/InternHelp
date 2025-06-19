import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/apiConfig';

const EditProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    phone: '',
    address: '',
    bio: '',
    username: '',
    email: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const username = await AsyncStorage.getItem('username');
        const email = await AsyncStorage.getItem('email');
        const phone = await AsyncStorage.getItem('phone') || '';
        const address = await AsyncStorage.getItem('address') || '';
        const bio = await AsyncStorage.getItem('bio') || '';
        setProfile({ username, email, phone, address, bio });
      } catch (err) {
        console.error('Failed to load profile from storage', err);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleSave = async () => {
    try {
      // Call backend API to update profile with allowed fields only
      const response = await fetch(`${API_BASE_URL}/api/user/edit-profile/${profile.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: profile.phone,
          address: profile.address,
          bio: profile.bio,
        }),
      });
      const json = await response.json();
      if (json.success) {
        // Update AsyncStorage with new values
        await AsyncStorage.setItem('phone', profile.phone);
        await AsyncStorage.setItem('address', profile.address);
        await AsyncStorage.setItem('bio', profile.bio);
        Alert.alert('Success', 'Profile updated successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Username (read-only)</Text>
        <TextInput style={styles.input} value={profile.username} editable={false} />

        <Text style={styles.label}>Email (read-only)</Text>
        <TextInput style={styles.input} value={profile.email} editable={false} />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={profile.phone}
          onChangeText={(text) => handleChange('phone', text)}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={profile.address}
          onChangeText={(text) => handleChange('address', text)}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          value={profile.bio}
          onChangeText={(text) => handleChange('bio', text)}
          multiline
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  scroll: { paddingBottom: 40 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
