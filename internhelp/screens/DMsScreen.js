import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import API_BASE_URL from '../config/apiConfig';

const socket = io(`${API_BASE_URL}`); // Replace with your backend IP

const DMsScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/users`);
      const json = await response.json();
      if (json.success) {
        const usersWithFlag = json.users.map(user => {
          let lastSeenUTC = user.last_seen || user.lastSeen || user.last_seen_time || null;

          let lastSeenIST = 'N/A';
          if (lastSeenUTC) {
            const utcDate = new Date(lastSeenUTC);
            const istDate = new Date(utcDate.getTime() + 330 * 60000); // Add 5 hours 30 minutes
            const options = {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            };
            lastSeenIST = istDate.toLocaleString('en-IN', options);
          }

          return {
            ...user,
            hasNewMessage: false,
            lastSeen: lastSeenIST,
          };
        });
        setUsers(usersWithFlag);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUsername = async () => {
    try {
      const username = await AsyncStorage.getItem('username');
      setCurrentUsername(username);
    } catch (err) {
      console.error('Failed to get current username from storage', err);
    }
  };

  useEffect(() => {
    getCurrentUsername();
    fetchUsers();
  }, []);

  useEffect(() => {
    // Listen for personal message events
    socket.on('receive-dm', (data) => {
      console.log('Received DM:', data);
      const senderName = data.from;
      setUsers((prevUsers) => {
        const index = prevUsers.findIndex(
          (user) => user.username === senderName || user._id === senderName
        );
        if (index === -1) return prevUsers; // sender not in list, no change

        const updatedUsers = [...prevUsers];
        const [user] = updatedUsers.splice(index, 1);
        user.hasNewMessage = true;
        updatedUsers.unshift(user);
        return updatedUsers;
      });
    });

    return () => {
      socket.off('receive-dm');
    };
  }, []);

  const filteredUsers = users.filter(user => user.username !== currentUsername);

  const renderUser = ({ item }) => {
    const initials = item.username ? item.username[0].toUpperCase() : '?';
    return (
      <TouchableOpacity
        style={[styles.userItem, item.hasNewMessage ? styles.highlightUser : null]}
        onPress={() => {
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user._id === item._id ? { ...user, hasNewMessage: false } : user
            )
          );
          navigation.navigate('ChatScreen', { user: item });
        }}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.userInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.userName}>{item.username || item.name}</Text>
            {item.hasNewMessage && (
              <View style={styles.newMessageBadge}>
                <Text style={styles.newMessageText}>New</Text>
              </View>
            )}
          </View>
          <Text style={styles.userStatus}>
            {item.online ? 'Online' : `Last seen: ${item.lastSeen || 'N/A'}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chats</Text>
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id || item.id}
        renderItem={renderUser}
      />
    </View>
  );
};

export default DMsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingTop: 30,
    backgroundColor: '#2563EB',
    color: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    elevation: 4,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
  },
  highlightUser: {
    backgroundColor: '#A9A9A9', // darker grey highlight for better visibility
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  userStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  newMessageBadge: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  newMessageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
