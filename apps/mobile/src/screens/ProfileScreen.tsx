import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, authFetch, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.email[0].toUpperCase() ?? '?';

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      const res = await authFetch('/api/auth/me/', { method: 'PATCH', body: JSON.stringify({ name }) });
      if (res.ok) Alert.alert('Success', 'Name updated.');
      else Alert.alert('Error', 'Failed to update name.');
    } finally { setSavingName(false); }
  };

  const handleSavePwd = async () => {
    if (!curPwd || !newPwd) return;
    setSavingPwd(true);
    try {
      const res = await authFetch('/api/auth/me/', {
        method: 'PATCH',
        body: JSON.stringify({ current_password: curPwd, new_password: newPwd }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Password updated.');
        setCurPwd(''); setNewPwd('');
      } else {
        const data = await res.json();
        const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed.';
        Alert.alert('Error', msg);
      }
    } finally { setSavingPwd(false); }
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Avatar card */}
      <View style={styles.avatarCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || '—'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.memberSince}>
          Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—'}
        </Text>
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>● Active</Text>
        </View>
      </View>

      {/* Edit name */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Edit Name</Text>
        <Text style={styles.label}>Full name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName}
          placeholder="Your name" placeholderTextColor="#484f58" />
        <TouchableOpacity style={styles.btn} onPress={handleSaveName} disabled={savingName}>
          {savingName ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Save Name</Text>}
        </TouchableOpacity>
      </View>

      {/* Change password */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <Text style={styles.label}>Current password</Text>
        <TextInput style={styles.input} value={curPwd} onChangeText={setCurPwd}
          placeholder="••••••••" placeholderTextColor="#484f58" secureTextEntry />
        <Text style={styles.label}>New password</Text>
        <TextInput style={styles.input} value={newPwd} onChangeText={setNewPwd}
          placeholder="At least 6 characters" placeholderTextColor="#484f58" secureTextEntry />
        <TouchableOpacity style={styles.btn} onPress={handleSavePwd} disabled={savingPwd || !curPwd || !newPwd}>
          {savingPwd ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Update Password</Text>}
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c11' },
  avatarCard: {
    backgroundColor: '#161b22', margin: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#30363d', padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, marginBottom: 12,
    backgroundColor: '#1f3050', borderWidth: 1, borderColor: '#30363d',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: '#58a6ff' },
  userName: { fontSize: 18, fontWeight: '700', color: '#e6edf3' },
  userEmail: { fontSize: 13, color: '#8b949e', marginTop: 2 },
  memberSince: { fontSize: 11, color: '#484f58', marginTop: 6 },
  activeBadge: {
    marginTop: 10, backgroundColor: 'rgba(63,185,80,0.12)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(63,185,80,0.3)',
  },
  activeText: { color: '#3fb950', fontSize: 12, fontWeight: '600' },
  section: {
    backgroundColor: '#161b22', margin: 16, marginTop: 0, borderRadius: 16,
    borderWidth: 1, borderColor: '#30363d', padding: 20,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#e6edf3', marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '600', color: '#484f58', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  input: {
    backgroundColor: '#0d1117', borderWidth: 1, borderColor: '#30363d',
    borderRadius: 10, padding: 12, fontSize: 14, color: '#e6edf3', marginBottom: 14,
  },
  btn: { backgroundColor: '#1f6feb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  logoutBtn: {
    margin: 16, marginTop: 0, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#f8514933', backgroundColor: '#f8514914',
  },
  logoutText: { color: '#f85149', fontSize: 15, fontWeight: '600' },
});
