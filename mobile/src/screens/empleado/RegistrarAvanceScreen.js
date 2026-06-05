import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { create } from '../../models/avanceModel';
import { useTheme } from '../../context/ThemeContext';

export default function RegistrarAvanceScreen({ route, navigation }) {
  const { reporteId } = route.params;
  const { c } = useTheme();
  const styles = useMemo(() => mkStyles(c), [c]);

  const [descripcion, setDescripcion] = useState('');
  const [porcentaje, setPorcentaje] = useState('');
  const [foto, setFoto] = useState(null);
  const [ubicacion, setUbicacion] = useState(null);
  const [cargandoGps, setCargandoGps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function elegirFoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!result.canceled && result.assets?.length > 0) setFoto(result.assets[0].uri);
  }

  async function capturarUbicacion() {
    setCargandoGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu ubicación para registrarla.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUbicacion({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      Alert.alert('Error', 'No se pudo obtener la ubicación.');
    } finally {
      setCargandoGps(false);
    }
  }

  async function handleGuardar() {
    if (!descripcion.trim()) return setError('La descripción es obligatoria.');
    const pct = parseInt(porcentaje, 10);
    if (porcentaje && (isNaN(pct) || pct < 0 || pct > 100)) return setError('El porcentaje debe ser entre 0 y 100.');
    setLoading(true);
    setError('');
    try {
      await create(reporteId, {
        descripcion,
        porcentaje: pct || null,
        lat: ubicacion?.lat ?? null,
        lng: ubicacion?.lng ?? null,
      });
      Alert.alert('¡Listo!', 'Avance registrado correctamente.', [
        { text: 'Volver', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Registrar avance</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Descripción *</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Describí el avance realizado..."
        placeholderTextColor={c.textSubtle}
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Porcentaje de avance</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: 50"
        placeholderTextColor={c.textSubtle}
        keyboardType="numeric"
        value={porcentaje}
        onChangeText={setPorcentaje}
      />

      <Text style={styles.label}>Foto del avance</Text>
      <TouchableOpacity style={styles.fotoBtn} onPress={elegirFoto}>
        <Text style={styles.fotoBtnText}>📷 Tomar foto</Text>
      </TouchableOpacity>
      {foto && <Image source={{ uri: foto }} style={styles.preview} />}

      <Text style={styles.label}>Ubicación (opcional)</Text>
      {ubicacion ? (
        <View style={styles.gpsCard}>
          <Text style={styles.gpsText}>📍 {ubicacion.lat.toFixed(5)}, {ubicacion.lng.toFixed(5)}</Text>
          <TouchableOpacity onPress={() => setUbicacion(null)}>
            <Text style={styles.gpsQuitar}>Quitar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.fotoBtn} onPress={capturarUbicacion} disabled={cargandoGps}>
          {cargandoGps
            ? <ActivityIndicator color={c.accent} />
            : <Text style={styles.fotoBtnText}>📡 Capturar mi ubicación actual</Text>}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleGuardar} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar avance</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function mkStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 40 },
    header: { fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 6, marginTop: 12 },
    input: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 14, fontSize: 15, backgroundColor: c.card, color: c.text },
    textarea: { minHeight: 100 },
    fotoBtn: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 14, alignItems: 'center', backgroundColor: c.card },
    fotoBtnText: { fontSize: 15, color: c.text },
    preview: { width: '100%', height: 200, borderRadius: 10, marginTop: 12, resizeMode: 'cover' },
    gpsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.successLight, borderRadius: 10, padding: 14 },
    gpsText: { fontSize: 14, color: c.success, flex: 1 },
    gpsQuitar: { fontSize: 13, color: c.danger, fontWeight: '600', marginLeft: 8 },
    btn: { backgroundColor: c.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    error: { backgroundColor: c.dangerLight, color: c.danger, padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 },
  });
}
