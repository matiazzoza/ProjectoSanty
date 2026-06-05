import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

import MisAsignacionesScreen from '../screens/empleado/MisAsignacionesScreen';
import PerfilEmpleadoScreen from '../screens/empleado/PerfilEmpleadoScreen';
import NotificacionesScreen from '../screens/vecino/NotificacionesScreen';

const Tab = createBottomTabNavigator();

export default function EmpleadoTabs() {
  const { c } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ size }) => {
          const icons = { Asignaciones: '📋', Notificaciones: '🔔', Perfil: '👤' };
          return <Text style={{ fontSize: size - 4 }}>{icons[route.name]}</Text>;
        },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textSubtle,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Asignaciones" component={MisAsignacionesScreen} options={{ title: 'Mis asignaciones', headerShown: false }} />
      <Tab.Screen name="Notificaciones" component={NotificacionesScreen} options={{ title: 'Notificaciones' }} />
      <Tab.Screen name="Perfil" component={PerfilEmpleadoScreen} />
    </Tab.Navigator>
  );
}
