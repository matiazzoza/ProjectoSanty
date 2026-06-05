import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { login } from '../../models/authModel';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const { c } = useTheme();
  const styles = useMemo(() => mkStyles(c), [c]);

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!usuario || !password) return setError('Completá todos los campos.');
    setLoading(true);
    setError('');
    try {
      const data = await login(usuario, password);
      if (data.user.role === 'admin' || data.user.role === 'superadmin') {
        setError('Los administradores solo pueden acceder desde la web.');
        return;
      }
      await signIn(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>ReportaMuni</Text>
        <Text style={styles.subtitle}>Iniciá sesión para continuar</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Usuario"
          placeholderTextColor={c.textSubtle}
          autoCapitalize="none"
          value={usuario}
          onChangeText={setUsuario}
        />

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

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Ingresar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>¿No tenés cuenta? Registrate</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function mkStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, justifyContent: 'center', padding: 24 },
    card: { backgroundColor: c.card, borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    title: { fontSize: 28, fontWeight: '700', color: '#1e40af', textAlign: 'center', marginBottom: 4 },
    subtitle: { fontSize: 14, color: c.textMuted, textAlign: 'center', marginBottom: 24 },
    input: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14, backgroundColor: c.inputBg, color: c.text },
    passwordWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: c.border, borderRadius: 10, backgroundColor: c.inputBg, marginBottom: 14 },
    passwordInput: { flex: 1, padding: 14, fontSize: 15, color: c.text },
    eyeBtn: { paddingHorizontal: 14, paddingVertical: 14 },
    eyeIcon: { fontSize: 18 },
    btn: { backgroundColor: c.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    link: { color: c.accent, textAlign: 'center', marginTop: 18, fontSize: 14 },
    error: { backgroundColor: c.dangerLight, color: c.danger, padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 },
  });
}
