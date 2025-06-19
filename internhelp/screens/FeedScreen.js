import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import API_BASE_URL from '../config/apiConfig';



const socket = io(`${API_BASE_URL}`); // Replace with your backend IP

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err);
});

const FeedScreen = () => {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [username, setUsername] = useState('');
  const flatListRef = useRef(null);

  const groupChannel = 'allStudents'; // single group chat channel
useEffect(() => {
  const showSub = Keyboard.addListener('keyboardDidShow', () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 300);
  });

  return () => {
    showSub.remove();
  };
}, []);

  useEffect(() => {
    const fetchUsernameAndHistory = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) {
          setUsername(storedUsername);

          const res = await fetch(`${API_BASE_URL}/api/chat`);
          const history = await res.json();
          setChat(history);
        }
      } catch (err) {
        console.error('Failed to load username or chat history:', err);
      }
    };

    fetchUsernameAndHistory();
  }, []);

  // Listen to incoming messages and load username
  useEffect(() => {
    if (!username) return;

    // Join room when username is set
    socket.emit('joinRoom', groupChannel);

    // Remove previous listener before adding new one to prevent duplicates
    socket.off('newGroupMessage');

    // Listen for new messages
    socket.on('newGroupMessage', (data) => {
      if (data.channel === groupChannel) {
        setChat((prev) => [...prev, data]);
      }
    });

    return () => {
      socket.emit('leaveRoom', groupChannel);
      socket.off('newGroupMessage');
      // Do not disconnect socket here to avoid affecting other components
      // socket.disconnect();
    };
  }, [username]);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };
  
  // Auto-scroll to latest message
 useEffect(() => {
  scrollToBottom();
}, [chat]);


  const sendMessage = () => {
    if (message.trim() === '' || !username) return;

    const msgData = {
      user: username,
      message,
      timestamp: new Date(),
      channel: groupChannel,
      replyTo,
    };

    socket.emit('groupMessage', msgData, (ack) => {
      console.log('Message sent acknowledgment:', ack);
    });

    // Remove local addition to chat to avoid duplicate messages
    // setChat((prev) => [...prev, msgData]);
    setMessage('');
    setReplyTo(null);
  };

  const handleReply = (msg) => setReplyTo(msg);

 const renderMessage = ({ item }) => {
  const isOwnMessage = item.user === username;

  return (
    
    <View
      style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        {!isOwnMessage && <Text style={styles.username}>{item.user}</Text>}
        {item.replyTo && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyUser}>Reply to {item.replyTo.user}:</Text>
            <Text style={styles.replyMessage}>{item.replyTo.message}</Text>
          </View>
        )}
        <Text style={styles.messageText}>{item.message}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <TouchableOpacity onPress={() => handleReply(item)}>
            <Text style={styles.replyButton}>↩</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};


 return (
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1 }}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // adjust if header present
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1 }}>
        <View style={{ paddingVertical: 20, paddingHorizontal: 16, backgroundColor: '#2563EB' }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 22, marginTop: 10 }}>
            Group Chat
          </Text>
        </View>

  <FlatList
    ref={flatListRef}
    data={chat}
    keyExtractor={(item, index) => index.toString()}
    renderItem={renderMessage}
    contentContainerStyle={{ paddingBottom: 10 }}
    keyboardShouldPersistTaps="handled"
    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
    scrollEventThrottle={16}
    decelerationRate="normal"
    showsVerticalScrollIndicator={true}
  />

        {replyTo && (
          <View style={styles.replyingToContainer}>
            <Text>Replying to {replyTo.user}: {replyTo.message}</Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Text style={styles.cancelReply}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            onFocus={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={{ color: 'white' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
);

};

export default FeedScreen;

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginVertical: 4,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 15,
    padding: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  ownBubble: {
    backgroundColor: '#DCF8C6', // WhatsApp greenish
    borderTopRightRadius: 0,
  },
  otherBubble: {
    backgroundColor: '#F0F0F0',
    borderTopLeftRadius: 0,
  },
  username: {
    fontWeight: 'bold',
    color: '#2563EB',
    fontSize: 13,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#111827',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 10,
    color: '#6B7280',
    marginRight: 8,
  },
  replyButton: {
    fontSize: 14,
    color: '#2563EB',
  },
  replyContainer: {
    backgroundColor: '#E0E7FF',
    padding: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  replyUser: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#4338CA',
  },
  replyMessage: {
    fontSize: 12,
    color: '#1E3A8A',
  },
  replyingToContainer: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderTopColor: '#DDD',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelReply: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopColor: '#DDD',
    borderTopWidth: 1,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    marginRight: 10,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
});
