import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/apiConfig';
const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    email: '',
    username: '',
    fullName: '',
    location: '',
    skills: '',
    internRole: '',
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const getCurrentUserEmail = async () => {
    try {
      const email = await AsyncStorage.getItem('email');
      if (email) {
        fetchProfile(email);
      }
    } catch (err) {
      console.error('Failed to get email from storage', err);
    }
  };

  const fetchProfile = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile?email=${email}`);
      const json = await response.json();
      if (json.success) {
        const user = json.user;
        setProfile({
          email: user.email || '',
          username: user.username || '',
          fullName: user.fullName || '',
          location: user.location || '',
          skills: (user.skills && user.skills.join(', ')) || '',
          internRole: user.internRole || '',
        });
      } else {
        Alert.alert('Error', 'Failed to load profile');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUserEmail();
  }, []);

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          skills: profile.skills.split(',').map(s => s.trim()),
        }),
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setEditMode(false);
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.replace('login');
    } catch (err) {
      Alert.alert('Error', 'Failed to logout');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileBox}>
        <Text style={styles.title}>My Profile</Text>

        {editMode ? (
          <>
            <ProfileInput label="Username" value={profile.username} onChangeText={(text) => handleChange('username', text)} />
            <ProfileInput label="Full Name" value={profile.fullName} onChangeText={(text) => handleChange('fullName', text)} />
            <ProfileInput label="Location" value={profile.location} onChangeText={(text) => handleChange('location', text)} />
            <ProfileInput label="Skills (comma separated)" value={profile.skills} onChangeText={(text) => handleChange('skills', text)} />
            <ProfileInput label="Intern Role" value={profile.internRole} onChangeText={(text) => handleChange('internRole', text)} />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ProfileText label="Email" value={profile.email} />
            <ProfileText label="Username" value={profile.username} />
            <ProfileText label="Full Name" value={profile.fullName} />
            <ProfileText label="Location" value={profile.location} />
            <ProfileText label="Skills" value={profile.skills} />
            <ProfileText label="Intern Role" value={profile.internRole} />
          </>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(!editMode)}>
            <Text style={styles.buttonText}>{editMode ? 'Cancel' : 'Edit Profile'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const ProfileInput = ({ label, value, onChangeText }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={`Enter ${label}`}
    />
  </View>
);

const ProfileText = ({ label, value }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.textValue}>{value}</Text>
  </View>
);

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F3F4F6',
    flexGrow: 1,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBox: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  textValue: {
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  editButton: {
    backgroundColor: '#4B5563',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
