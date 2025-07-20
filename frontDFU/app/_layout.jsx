import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="home" />
      <Stack.Screen name="logup"/>
      
    </Stack>
  );
}

// O Stack é um componente do expo-router que permite criar uma pilha de telas
// O Stack.Screen é usado para definir as telas da pilha
