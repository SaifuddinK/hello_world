import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Hello World</Text>
      <Text style={styles.subtitle}>my_hello_world — Mobile</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 18,
    color: '#6b7280',
  },
});
