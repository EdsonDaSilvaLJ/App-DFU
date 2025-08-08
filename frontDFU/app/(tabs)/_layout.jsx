import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: 'Pacientes',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="list" size={size || 24} color={color} />
          )
        }} 
      />

      <Tabs.Screen 
        name="cadastrar" 
        options={{ 
          title: 'Cadastrar',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add-circle" size={size || 24} color={color} />
          )
        }} 
      />
    </Tabs>
  );
}