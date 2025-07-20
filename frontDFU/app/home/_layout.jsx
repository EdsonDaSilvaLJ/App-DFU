import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';


export default function Layout() {
  return (
    <Tabs>

      <Tabs.Screen name="cadastrar" options={{ 
        title: '', 
        tabBarIcon: ({color}) => (<MaterialIcons name= "add-circle" size={24} color = {color} />)
      }} />

      <Tabs.Screen name="index" options={{ 
        title: '',
        tabBarLabel: ({color}) => (<MaterialIcons name = "list" size={24} color={color} />) }} />

    </Tabs>
  );
}

// O Tabs é um componente do expo-router que permite criar abas de navegação
// O Tabs.Screen é usado para definir as telas das abas