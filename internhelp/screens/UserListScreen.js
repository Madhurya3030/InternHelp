import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import io from 'socket.io-client';

const socket = io('http://192.168.177.197:5000'); // Replace with your backend IP

const UserListScreen = ({ navigation }) => {
  const [users, setUsers] = useState([
    { id: '1', name: 'Intern1', online: true, lastSeen: '5 mins ago' },
    { id: '2', name: 'Intern2', online: false, lastSeen: '10 mins ago' },
    { id: '3', name: 'Intern3', online: true, lastSeen: 'Online now' },
  ]);

  useEffect(() => {
    // Listen for personal message events
    socket.on('receive-dm', (data) => {
      const senderName = data.from;
      setUsers((prevUsers) => {
        // Find the user index
        const index = prevUsers.findIndex((user) => user.name === senderName);
        if (index === -1) return prevUsers; // sender not in list, no change

        // Move the user to the top
        const updatedUsers = [...prevUsers];
        const [user] = updatedUsers.splice(index, 1);
        updatedUsers.unshift(user);
        return updatedUsers;
      });
    });

    return () => {
      socket.off('receive-dm');
    };
  }, []);

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate('ChatScreen', { user: item })}
    >
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userStatus}>
        {item.online ? 'Online' : `Last seen: ${item.lastSeen}`}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Users</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
      />
    </View>
  );
};

export default UserListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    fontWeight: 'bold',
    fontSize: 16,
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#E0E7FF',
  },
  userItem: {
    padding: 10,
    borderBottomColor: '#DDD',
    borderBottomWidth: 1,
  },
  userName: {
    fontWeight: 'bold',
  },
  userStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
});
