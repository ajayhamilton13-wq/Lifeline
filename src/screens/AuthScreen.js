import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';
import { saveUser } from '../data';
import { colors } from '../theme';
import { Button, s } from '../components/ui';

const messages = {
  'auth/invalid-email': 'That email address does not look right.',
  'auth/email-already-in-use': 'An account already uses that email. Try signing in.',
  'auth/weak-password': 'Use a password with at least 6 characters.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/network-request-failed': 'No internet. You need a connection to sign in the first time.',
};

export default function AuthScreen({ onNameSet }) {
  const [mode, setMode] = useState('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) throw { code: 'name' };
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
        await saveUser(cred.user.uid, name.trim());
        onNameSet && onNameSet(name.trim());
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e) {
      Alert.alert('Sorry', e.code === 'name' ? 'Please enter your name.' : messages[e.code] || e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!email.trim()) return Alert.alert('Enter your email', 'Type your email above, then tap Forgot password.');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Check your email', 'We sent a link to reset your password.');
    } catch (e) {
      Alert.alert('Sorry', messages[e.code] || e.message);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{ width: 84, height: 84, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="pulse" size={50} color="#fff" />
          </View>
          <Text style={{ color: colors.text, fontSize: 34, fontWeight: '900', marginTop: 14 }}>Lifeline</Text>
          <Text style={[s.muted, { textAlign: 'center', marginTop: 6, fontSize: 15 }]}>
            Know when power and water go out near you. Stay in touch when the internet doesn't.
          </Text>
        </View>

        {mode === 'signup' ? (
          <>
            <Text style={s.label}>Your name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="First name" placeholderTextColor={colors.muted} style={s.input} maxLength={40} />
          </>
        ) : null}
        <Text style={s.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="you@gmail.com" placeholderTextColor={colors.muted} style={s.input} autoCapitalize="none" keyboardType="email-address" />
        <Text style={s.label}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="At least 6 characters" placeholderTextColor={colors.muted} style={s.input} secureTextEntry />

        <Button title={mode === 'signup' ? 'Create account' : 'Sign in'} onPress={submit} loading={busy} style={{ marginTop: 22 }} />

        <Pressable onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')} style={{ marginTop: 18, alignItems: 'center' }}>
          <Text style={{ color: colors.text }}>
            {mode === 'signup' ? 'Already have an account? ' : 'New here? '}
            <Text style={{ color: colors.accent, fontWeight: '700' }}>{mode === 'signup' ? 'Sign in' : 'Create account'}</Text>
          </Text>
        </Pressable>
        {mode === 'signin' ? (
          <Pressable onPress={reset} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={s.muted}>Forgot password?</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
