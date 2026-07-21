import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setError(''); setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>📈</Text>
          </View>
          <View>
            <Text style={styles.appName}>StockTicker</Text>
            <Text style={styles.appTag}>Market Intelligence</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#484f58"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#484f58"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Sign in</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.switchText}>
              Don't have an account?{' '}
              <Text style={styles.switchLink}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#080c11' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32, justifyContent: 'center' },
  logoBox: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#1f6feb', alignItems: 'center', justifyContent: 'center',
  },
  logoIcon: { fontSize: 22 },
  appName: { fontSize: 20, fontWeight: '700', color: '#e6edf3' },
  appTag: { fontSize: 11, color: '#484f58', marginTop: 2 },
  card: {
    backgroundColor: '#161b22', borderRadius: 16,
    borderWidth: 1, borderColor: '#30363d',
    padding: 24,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#e6edf3', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#8b949e', marginBottom: 20 },
  errorBox: {
    backgroundColor: '#f8514914', borderWidth: 1, borderColor: '#f8514933',
    borderRadius: 8, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#f85149', fontSize: 13 },
  label: { fontSize: 11, fontWeight: '600', color: '#484f58', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  input: {
    backgroundColor: '#0d1117', borderWidth: 1, borderColor: '#30363d',
    borderRadius: 10, padding: 12, fontSize: 14, color: '#e6edf3', marginBottom: 16,
  },
  btn: {
    backgroundColor: '#1f6feb', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 4, marginBottom: 20,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  switchText: { textAlign: 'center', fontSize: 13, color: '#8b949e' },
  switchLink: { color: '#388bfd', fontWeight: '600' },
});
