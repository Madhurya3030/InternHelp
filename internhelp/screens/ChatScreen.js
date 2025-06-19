import API_BASE_URL from '../config/apiConfig';
import io from 'socket.io-client';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, FlatList,
  TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Only create socket once globally
const socket = io(API_BASE_URL, {
  transports: ['websocket'],
});

const ChatScreen = ({ route }) => {
  const { user } = route.params;
  const [message, setMessage] = useState('');
  const [dmChat, setDmChat] = useState([]);
  const [currentUsername, setCurrentUsername] = useState(null);
  const flatListRef = useRef(null);
  const navigation = useNavigation();


  useEffect(() => {
    AsyncStorage.getItem('username')
      .then(u => setCurrentUsername(u))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!currentUsername || !user?.username) return;

    // Sort usernames to create consistent channel
    const users = [currentUsername, user.username].sort();
    const dmChannel = `dm_${users[0]}_${users[1]}`;

    // Join the DM room
    socket.emit('joinRoom', dmChannel);

    // Load existing chat history from API
    fetch(`${API_BASE_URL}/api/chat?channel=${dmChannel}`)
      .then(res => res.json())
      .then(setDmChat)
      .catch(console.error);

    // Handler for incoming DM messages from server
    const handleReceive = data => {
      // Server sends `user` field for sender, not `from`/`to`
      // We also compare the channel names for safety
      const messageChannel = data.channel;
      if (messageChannel === dmChannel) {
        setDmChat(prev => [...prev, data]);
        // Scroll to bottom on new message
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };

    socket.off('receive-dm', handleReceive);
    socket.on('receive-dm', handleReceive);

    return () => {
      socket.emit('leaveRoom', dmChannel);
      socket.off('receive-dm', handleReceive);
    };
  }, [currentUsername, user]);

  const sendMessage = () => {
    if (!message.trim() || !currentUsername) return;

    const users = [currentUsername, user.username].sort();
    const dmChannel = `dm_${users[0]}_${users[1]}`;

    const msgData = {
      from: currentUsername, // for client side convenience
      to: user.username,
      user: currentUsername, // server expects this field for sender
      message: message.trim(),
      timestamp: new Date(),
      channel: dmChannel,
    };

    // Emit message to server, server will broadcast to room
    socket.emit('send-dm', msgData, (response) => {
      if (response.status !== 'ok') {
        console.error('Message send failed:', response.error);
      }
    });

    // Optionally add to local chat instantly for better UX,
    // but server might send a saved message with _id etc., so
    // rely on 'receive-dm' to update list properly
    setMessage('');
  };

  const renderMessage = ({ item }) => {
    const isMine = item.user === currentUsername;
    return (
      <View style={[
        styles.messageContainer,
        isMine ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMine ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#E5E7EB' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
       <View style={styles.chatHeader}>
  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
    <Ionicons name="arrow-back" size={24} color="#fff" />
  </TouchableOpacity>
  <Text style={styles.chatHeaderText}>{user.username}</Text>
</View>

        <FlatList
          ref={flatListRef}
          data={dmChat}
          keyExtractor={(item) => item._id || item.timestamp.toString()} // Prefer unique id or timestamp
          renderItem={renderMessage}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={{ color: '#fff' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  chatHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#3B82F6',
  paddingVertical: 25,
  paddingHorizontal: 12,
  elevation: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2
},
backButton: {
  marginTop : 14,
  marginRight: 12,
},
chatHeaderText: {
  marginTop: 14,
  fontSize: 20,
  fontWeight: 'bold',
  color: '#fff',
},

  messageContainer: {
    paddingHorizontal: 10,
    marginVertical: 4,
    flexDirection: 'row',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  ownBubble: {
    backgroundColor: '#DCFCE7', // green-100
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  otherBubble: {
    backgroundColor: '#F3F4F6', // gray-100
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
    color: '#111827', // gray-900
  },
  timestamp: {
    fontSize: 11,
    color: '#6B7280', // gray-500
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#E5E7EB', // gray-200
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#F9FAFB', // gray-50
    borderRadius: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#3B82F6', // blue-500
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 2,
  }
});
