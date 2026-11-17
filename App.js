import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StatusBar as RNStatusBar, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase';
import { AppProvider } from './src/AppContext';
import AuthScreen from './src/screens/AuthScreen';
import MainTabs from './src/MainTabs';
import { colors } from './src/theme';

export default function App() {
  const [user, setUser] = useState(undefined);
  const [newName, setNewName] = useState(null);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u || null)), []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 44 }}>
      <StatusBar style="light" />
      {user === undefined ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : user ? (
        <AppProvider key={user.uid} user={user} initialName={newName}>
          <MainTabs />
        </AppProvider>
      ) : (
        <AuthScreen onNameSet={setNewName} />
      )}
    </View>
  );
}
