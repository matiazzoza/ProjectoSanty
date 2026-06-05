import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { register } from '../../models/authModel';

export default function RegisterScreen({ navigation }) {
  const { c } = useTheme();
  const styles = useMemo(() => mkStyles(c), [c]);

  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  async function handleRegister() {
    if (!nombre || !usuario || !email || !password) return setError('Completá todos los campos.');
    setLoading(true);
    setError('');
    try {
      await register({ name: nombre, username: usuario, email, password });
      setExito(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (exito) {
    return (
      <View style={styles.exitoContainer}>
        <View style={styles.card}>
          <Text style={styles.exitoIcon}>📧</Text>
          <Text style={styles.exitoTitle}>¡Cuenta creada!</Text>
          <Text style={styles.exitoText}>Te enviamos un email de verificación. Revisá tu bandeja de entrada y hacé clic en el enlace para activar tu cuenta.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnText}>Ir al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Crear cuenta</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor={c.textSubtle} value={nombre} onChangeText={setNombre} />
          <TextInput style={styles.input} placeholder="Usuario" placeholderTextColor={c.textSubtle} autoCapitalize="none" value={usuario} onChangeText={setUsuario} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={c.textSubtle} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Contraseña"
              placeholderTextColor={c.textSubtle}
              secureTextEntry={!verPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setVerPassword(!verPassword)}>
              <Text style={styles.eyeIcon}>{verPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Registrarme</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>¿Ya tenés cuenta? Ingresá</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function mkStyles(c) {
  return StyleSheet.create({
    exitoContainer: { flex: 1, backgroundColor: c.bg, justifyContent: 'center', padding: 24 },
    container: { flexGrow: 1, backgroundColor: c.bg, justifyContent: 'center', padding: 24 },
    card: { backgroundColor: c.card, borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    title: { fontSize: 24, fontWeight: '700', color: '#1e40af', textAlign: 'center', marginBottom: 24 },
    input: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14, backgroundColor: c.inputBg, color: c.text },
    passwordWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: c.border, borderRadius: 10, backgroundColor: c.inputBg, marginBottom: 14 },
    passwordInput: { flex: 1, padding: 14, fontSize: 15, color: c.text },
    eyeBtn: { paddingHorizontal: 14, paddingVertical: 14 },
    eyeIcon: { fontSize: 18 },
    btn: { backgroundColor: c.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    link: { color: c.accent, textAlign: 'center', marginTop: 18, fontSize: 14 },
    error: { backgroundColor: c.dangerLight, color: c.danger, padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 },
    exitoIcon: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
    exitoTitle: { fontSize: 22, fontWeight: '700', color: c.text, textAlign: 'center', marginBottom: 12 },
    exitoText: { fontSize: 14, color: c.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  });
}
