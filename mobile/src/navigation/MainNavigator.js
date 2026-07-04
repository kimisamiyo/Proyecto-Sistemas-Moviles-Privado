import React from 'react';
import * as Linking from 'expo-linking';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/tokens';
import { DEFAULT_TAB_BAR_HEIGHT } from '../utils/responsive';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import FeedScreen from '../screens/FeedScreen';
import MapScreen from '../screens/MapScreen';
import EventsScreen from '../screens/EventsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SquadsScreen from '../screens/SquadsScreen';
import CreateSquadScreen from '../screens/CreateSquadScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SquadDetailScreen from '../screens/SquadDetailScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';
import CheckInScannerScreen from '../screens/CheckInScannerScreen';
import CreatorDashboardScreen from '../screens/CreatorDashboardScreen';
import RequestOrganizerScreen from '../screens/RequestOrganizerScreen';
import AdminRoleRequestsScreen from '../screens/AdminRoleRequestsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const FeedStack = createNativeStackNavigator();
const EventStack = createNativeStackNavigator();
const MessageStack = createNativeStackNavigator();
const SquadsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const MapStack = createNativeStackNavigator();

function FeedStackNavigator() {
  return (
    <FeedStack.Navigator screenOptions={{ headerShown: false }}>
      <FeedStack.Screen name="FeedHome" component={FeedScreen} />
      <FeedStack.Screen name="EventDetail" component={EventDetailScreen} />
      <FeedStack.Screen name="CreateSquad" component={CreateSquadScreen} />
      <FeedStack.Screen name="CreateEvent" component={CreateEventScreen} />
      <FeedStack.Screen name="SquadDetail" component={SquadDetailScreen} />
      <FeedStack.Screen name="PublicProfile" component={PublicProfileScreen} />
    </FeedStack.Navigator>
  );
}

function EventStackNavigator() {
  return (
    <EventStack.Navigator screenOptions={{ headerShown: false }}>
      <EventStack.Screen name="EventsHome" component={EventsScreen} />
      <EventStack.Screen name="EventDetail" component={EventDetailScreen} />
      <EventStack.Screen name="CreateSquad" component={CreateSquadScreen} />
      <EventStack.Screen name="CreateEvent" component={CreateEventScreen} />
      <EventStack.Screen name="SquadDetail" component={SquadDetailScreen} />
      <EventStack.Screen name="PublicProfile" component={PublicProfileScreen} />
    </EventStack.Navigator>
  );
}

function MessageStackNavigator() {
  return (
    <MessageStack.Navigator screenOptions={{ headerShown: false }}>
      <MessageStack.Screen name="MessagesHome" component={MessagesScreen} />
      <MessageStack.Screen name="Chat" component={ChatScreen} />
      <MessageStack.Screen name="PublicProfile" component={PublicProfileScreen} />
    </MessageStack.Navigator>
  );
}

function SquadsStackNavigator() {
  return (
    <SquadsStack.Navigator screenOptions={{ headerShown: false }}>
      <SquadsStack.Screen name="SquadsHome" component={SquadsScreen} />
      <SquadsStack.Screen name="SquadDetail" component={SquadDetailScreen} />
      <SquadsStack.Screen name="CreateSquad" component={CreateSquadScreen} />
      <SquadsStack.Screen name="EventDetail" component={EventDetailScreen} />
      <SquadsStack.Screen name="PublicProfile" component={PublicProfileScreen} />
    </SquadsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="CreateEvent" component={CreateEventScreen} />
      <ProfileStack.Screen name="EventDetail" component={EventDetailScreen} />
      <ProfileStack.Screen name="PublicProfile" component={PublicProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function MapStackNavigator() {
  return (
    <MapStack.Navigator screenOptions={{ headerShown: false }}>
      <MapStack.Screen name="MapHome" component={MapScreen} />
      <MapStack.Screen name="EventDetail" component={EventDetailScreen} />
      <MapStack.Screen name="PublicProfile" component={PublicProfileScreen} />
    </MapStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Feed') iconName = focused ? 'compass' : 'compass-outline';
          else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Squads') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Events') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Messages') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.on_surface_variant,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'rgba(250,249,247,0.92)' : colors.surface_container_lowest,
          borderTopWidth: 1,
          borderTopColor: colors.surface_container_high,
          elevation: 0,
          height: DEFAULT_TAB_BAR_HEIGHT,
          paddingBottom: Platform.OS === 'ios' ? 24 : 4,
          paddingTop: 4,
        },
        lazy: true,
      })}
    >
      <Tab.Screen name="Feed" component={FeedStackNavigator} />
      <Tab.Screen name="Map" component={MapStackNavigator} />
      <Tab.Screen name="Squads" component={SquadsStackNavigator} />
      <Tab.Screen name="Events" component={EventStackNavigator} />
      <Tab.Screen name="Messages" component={MessageStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

function AuthenticatedNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <Stack.Screen name="CheckInScanner" component={CheckInScannerScreen} />
      <Stack.Screen name="CreatorDashboard" component={CreatorDashboardScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="RequestOrganizer" component={RequestOrganizerScreen} />
      <Stack.Screen name="AdminRoleRequests" component={AdminRoleRequestsScreen} />
    </Stack.Navigator>
  );
}

// Deep linking: eventus://event/:eventId lleva directo a la inscripción del
// evento (invitaciones por WhatsApp generadas por el backend).
const linking = {
  prefixes: [Linking.createURL('/'), 'eventus://'],
  config: {
    screens: {
      App: {
        screens: {
          MainTabs: {
            screens: {
              Feed: {
                initialRouteName: 'FeedHome',
                screens: {
                  EventDetail: 'event/:eventId',
                },
              },
            },
          },
        },
      },
    },
  },
};

export default function MainNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <Stack.Screen name="App" component={AuthenticatedNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
