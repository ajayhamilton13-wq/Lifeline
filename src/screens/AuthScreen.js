import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';
import { saveUser } from '../data';
import { colors, radii, tint, type } from '../theme';
import { Button, Field } from '../components/ui';

const messages = {
  'auth/invalid-email': 'That email address does not look right.',
  'auth/email-already-in-use': 'An account already uses that email. Try signing in.',
  'auth/weak-password': 'Use a password with at least 6 characters.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/network-request-failed': 'No internet. You need a connection to sign in the first time.',
};

const FEATURES = [
  { icon: 'flash', color: colors.power, text: 'Live map of outages near you' },
  { icon: 'git-network', color: colors.mesh, text: 'Message without Wi-Fi or data' },
  { icon: 'hand-left', color: colors.share, text: 'Share what you have in a crisis' },
];

function Logo() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute', width: 96, height: 96, borderRadius: 32, borderWidth: 2, borderColor: colors.accent,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.35] }) }],
        }}
      />
      <View style={{ width: 80, height: 80, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="pulse" size={46} color="#fff" />
      </View>
    </View>
  );
}

export default function AuthScreen({ onNameSet }) {
  const [mode, setMode] = useState('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const signup = mode === 'signup';

  async function submit() {
    setBusy(true);
    try {
      if (signup) {
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
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 36 }} keyboardShouldPersistTaps="handled">
        <Logo />
        <Text style={[type.display, { marginTop: 22 }]}>Lifeline</Text>
        <Text style={[type.body, { marginTop: 6, fontSize: 16 }]}>
          Know when power and water go out near you. Stay connected when the internet doesn't.
        </Text>

        {signup ? (
          <View style={{ marginTop: 22, gap: 10 }}>
            {FEATURES.map((f) => (
              <View key={f.text} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: tint(f.color, 0.16), alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={f.icon} size={16} color={f.color} />
                </View>
                <Text style={{ color: colors.textSoft, fontWeight: '600', marginLeft: 12, fontSize: 14 }}>{f.text}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ marginTop: 28, padding: 18, borderRadius: radii.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 14 }}>
          <Text style={type.heading}>{signup ? 'Create your account' : 'Welcome back'}</Text>
          {signup ? <Field label="Name" icon="person-outline" value={name} onChangeText={setName} placeholder="Your first name" maxLength={40} /> : null}
          <Field label="Email" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="you@gmail.com" autoCapitalize="none" keyboardType="email-address" />
          <Field label="Password" icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />
          <Button title={signup ? 'Create account' : 'Sign in'} icon={signup ? 'arrow-forward' : 'log-in-outline'} onPress={submit} loading={busy} style={{ marginTop: 4 }} />
          {!signup ? (
            <Pressable onPress={reset} style={{ alignItems: 'center' }} hitSlop={8}>
              <Text style={{ color: colors.muted, fontWeight: '600' }}>Forgot password?</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable onPress={() => setMode(signup ? 'signin' : 'signup')} style={{ marginTop: 20, alignItems: 'center', padding: 8 }}>
          <Text style={{ color: colors.textSoft }}>
            {signup ? 'Already have an account? ' : 'New to Lifeline? '}
            <Text style={{ color: colors.accent, fontWeight: '800' }}>{signup ? 'Sign in' : 'Create one'}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
