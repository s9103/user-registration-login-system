import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchCurrentUser, extractErrorMessage } from '../api/authApi';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  // Calls the protected /api/auth/me endpoint to prove the stored JWT
  // is actually being validated by the backend, not just trusted locally.
  async function loadProfile() {
    try {
      const data = await fetchCurrentUser();
      setProfile(data);
    } catch (err) {
      Alert.alert('Session error', extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.fullName} 👋</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Fetched from protected /api/auth/me:</Text>
          <Text style={styles.value}>Name: {profile?.fullName}</Text>
          <Text style={styles.value}>Email: {profile?.email}</Text>
          <Text style={styles.value}>User ID: {profile?.id}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  card: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 18,
    marginBottom: 24,
  },
  label: { color: '#666', marginBottom: 8, fontSize: 13 },
  value: { fontSize: 16, marginBottom: 4 },
  button: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
