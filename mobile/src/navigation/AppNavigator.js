import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme, DARK } from '../context/ThemeContext';

import AuthStack from './AuthStack';
import VecinoTabs from './VecinoTabs';
import EmpleadoTabs from './EmpleadoTabs';
import { navigationRef } from './navigationRef';
import ReporteEmpleadoScreen from '../screens/empleado/ReporteEmpleadoScreen';
import RegistrarAvanceScreen from '../screens/empleado/RegistrarAvanceScreen';
import MensajesScreen from '../screens/empleado/MensajesScreen';

const Stack = createNativeStackNavigator();

const NavLightTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: '#2563eb', background: '#f1f5f9', card: '#ffffff', text: '#1e293b', border: '#e2e8f0', notification: '#2563eb' },
};

const NavDarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: { ...DefaultTheme.colors, primary: '#3b82f6', background: '#0f172a', card: '#1e293b', text: '#f1f5f9', border: '#334155', notification: '#3b82f6' },
};

function EmpleadoRoot() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="EmpleadoMain" component={EmpleadoTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ReporteEmpleado" component={ReporteEmpleadoScreen} options={{ title: 'Reporte' }} />
      <Stack.Screen name="RegistrarAvance" component={RegistrarAvanceScreen} options={{ title: 'Registrar avance' }} />
      <Stack.Screen name="Mensajes" component={MensajesScreen} options={{ title: 'Mensajes al admin' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? DARK.bg : '#f1f5f9' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={isDark ? NavDarkTheme : NavLightTheme}>
      {!user ? (
        <AuthStack />
      ) : user.role === 'empleado' ? (
        <EmpleadoRoot />
      ) : (
        <VecinoTabs />
      )}
    </NavigationContainer>
  );
}
