import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeedScreen from './FeedScreen';
import ChatScreen from './ChatScreen';
import ProfileScreen from './ProfileScreen';
import DMsScreen from './DMsScreen';

const Tab = createBottomTabNavigator();
const DMsStack = createNativeStackNavigator();

const DMsStackScreen = () => (
  <DMsStack.Navigator screenOptions={{ headerShown: false }}>
    <DMsStack.Screen name="DMsScreen" component={DMsScreen} />
    <DMsStack.Screen name="ChatScreen" component={ChatScreen} />
  </DMsStack.Navigator>
);

const HomePage = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="DMs" component={DMsStackScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default HomePage;
