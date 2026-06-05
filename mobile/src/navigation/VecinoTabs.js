import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';

import ReportesScreen from '../screens/vecino/ReportesScreen';
import CrearReporteScreen from '../screens/vecino/CrearReporteScreen';
import ReporteDetalleScreen from '../screens/vecino/ReporteDetalleScreen';
import NotificacionesScreen from '../screens/vecino/NotificacionesScreen';
import PerfilScreen from '../screens/vecino/PerfilScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ReportesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ReportesMain" component={ReportesScreen} options={{ title: 'Reportes' }} />
      <Stack.Screen name="ReporteDetalle" component={ReporteDetalleScreen} options={{ title: 'Detalle' }} />
    </Stack.Navigator>
  );
}

export default function VecinoTabs() {
  const { c } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ size }) => {
          const icons = { ReportesTab: '🏛️', NuevoReporte: '➕', Notificaciones: '🔔', Perfil: '👤' };
          return <Text style={{ fontSize: size - 4 }}>{icons[route.name]}</Text>;
        },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textSubtle,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
        headerShown: false,
      })}
    >
      <Tab.Screen name="ReportesTab" component={ReportesStack} options={{ title: 'Reportes' }} />
      <Tab.Screen name="NuevoReporte" component={CrearReporteScreen} options={{ title: 'Reportar' }} />
      <Tab.Screen name="Notificaciones" component={NotificacionesScreen} options={{ title: 'Notificaciones' }} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}
