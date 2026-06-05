import { useState, useEffect, useRef, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image, Alert,
  Modal, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import { uriToBase64 } from '../../utils/imageUtils';
import * as Location from 'expo-location';
import { create } from '../../models/reporteModel';
import { getAll as getBarrios } from '../../models/barrioModel';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CATEGORIES } from '../../utils/constants';
import { buildMapHTML } from '../../utils/mapHTML';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const HEADERS = { 'User-Agent': 'ReportaMuni/1.0', 'Accept-Language': 'es' };
const DEFAULT_LAT = -26.1847;
const DEFAULT_LNG = -58.1741;

function formatDireccion(addr) {
  if (!addr) return '';
  const { road, house_number, suburb, city_district, city, town, village } = addr;
  const calle = [road, house_number].filter(Boolean).join(' ');
  const zona = suburb || city_district || '';
  const localidad = city || town || village || '';
  return [calle, zona, localidad].filter(Boolean).join(', ');
}

export default function CrearReporteScreen({ navigation }) {
  const { user } = useAuth();
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => mkStyles(c), [c]);
  const webViewRef = useRef(null);
  const searchTimer = useRef(null);

  // Campos del formulario
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [direccion, setDireccion] = useState('');
  const [barrioId, setBarrioId] = useState(null);
  const [barrioNombre, setBarrioNombre] = useState('');
  const [fotoUri, setFotoUri] = useState(null); // uri local del archivo seleccionado

  // Ubicación
  const [coords, setCoords] = useState(null);
  const [mapListo, setMapListo] = useState(false);
  const [pendingGoto, setPendingGoto] = useState(null);

  // Búsqueda
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando, setBuscando] = useState(false);

  // UI
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showBarrioModal, setShowBarrioModal] = useState(false);
  const [barrios, setBarrios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cargandoGPS, setCargandoGPS] = useState(true);

  useEffect(() => {
    getBarrios().then(setBarrios).catch(() => {});
    iniciarGPS();
  }, []);

  // Cuando el mapa está listo y hay coordenadas pendientes, enviárselas
  useEffect(() => {
    if (mapListo && pendingGoto) {
      enviarAlMapa(pendingGoto.lat, pendingGoto.lng);
      setPendingGoto(null);
    }
  }, [mapListo, pendingGoto]);

  async function iniciarGPS() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setCargandoGPS(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = loc.coords;
      setCoords({ lat, lng });
      // Reverse geocode
      const res = await fetch(`${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: HEADERS });
      const data = await res.json();
      if (data.address) setDireccion(formatDireccion(data.address));
      // Mover el mapa (si ya está listo, enviar directo; si no, guardar como pending)
      if (mapListo) {
        enviarAlMapa(lat, lng);
      } else {
        setPendingGoto({ lat, lng });
      }
    } catch {}
    finally { setCargandoGPS(false); }
  }

  function enviarAlMapa(lat, lng) {
    webViewRef.current?.injectJavaScript(
      `handleMsg({data: JSON.stringify({type:'goto', lat:${lat}, lng:${lng}})});`
    );
  }

  // Mensaje del mapa: el usuario tocó o arrastró el pin
  async function handleMapMessage(event) {
    try {
      const { type, lat, lng } = JSON.parse(event.nativeEvent.data);
      if (type !== 'move') return;
      setCoords({ lat, lng });
      const res = await fetch(`${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: HEADERS });
      const data = await res.json();
      if (data.address) setDireccion(formatDireccion(data.address));
      setSugerencias([]);
    } catch {}
  }

  // Búsqueda de dirección con debounce
  function handleDireccionChange(texto) {
    setDireccion(texto);
    setSugerencias([]);
    clearTimeout(searchTimer.current);
    if (texto.trim().length < 3) return;
    searchTimer.current = setTimeout(() => buscarSugerencias(texto), 600);
  }

  async function buscarSugerencias(query) {
    setBuscando(true);
    try {
      const res = await fetch(
        `${NOMINATIM}/search?q=${encodeURIComponent(query + ', Formosa, Argentina')}&format=json&limit=5&addressdetails=1`,
        { headers: HEADERS }
      );
      setSugerencias(await res.json());
    } catch {}
    finally { setBuscando(false); }
  }

  function elegirSugerencia(item) {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const dir = item.address ? formatDireccion(item.address) : item.display_name;
    setDireccion(dir);
    setCoords({ lat, lng });
    setSugerencias([]);
    enviarAlMapa(lat, lng);
  }

  async function elegirFoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.5 });
    if (!result.canceled && result.assets?.length > 0) setFotoUri(result.assets[0].uri);
  }

  async function tomarFoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!result.canceled && result.assets?.length > 0) setFotoUri(result.assets[0].uri);
  }

  async function handleEnviar() {
    if (!titulo || !descripcion || !categoria || !direccion) return setError('Completá todos los campos obligatorios.');
    setLoading(true);
    setError('');
    try {
      const photo = fotoUri ? await uriToBase64(fotoUri) : null;
      const nuevoReporte = await create({
        title: titulo, description: descripcion, category: categoria,
        address: direccion, lat: coords?.lat ?? null, lng: coords?.lng ?? null,
        photo, authorId: user.id, barrioId: barrioId ?? null,
      });
      setTitulo(''); setDescripcion(''); setCategoria(''); setDireccion('');
      setFotoUri(null); setCoords(null); setBarrioId(null); setBarrioNombre('');
      navigation.navigate('ReportesTab', {
        screen: 'ReporteDetalle',
        params: { reporteId: nuevoReporte.id },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const mapHTML = useMemo(() => buildMapHTML(DEFAULT_LAT, DEFAULT_LNG, isDark), [isDark]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, paddingTop: insets.top }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Nuevo reporte</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Título */}
        <Text style={styles.label}>Título *</Text>
        <TextInput style={styles.input} placeholder="Ej: Bache en calle San Martín" placeholderTextColor={c.textSubtle} value={titulo} onChangeText={setTitulo} />

        {/* Descripción */}
        <Text style={styles.label}>Descripción *</Text>
        <TextInput style={[styles.input, styles.textarea]} placeholder="Describí el problema..." placeholderTextColor={c.textSubtle} value={descripcion} onChangeText={setDescripcion} multiline numberOfLines={4} textAlignVertical="top" />

        {/* Categoría */}
        <Text style={styles.label}>Categoría *</Text>
        <View style={styles.categorias}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catBtn, categoria === cat.id && styles.catBtnActive]}
              onPress={() => setCategoria(cat.id)}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catLabel, categoria === cat.id && styles.catLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ubicación */}
        <Text style={styles.label}>Ubicación *</Text>

        {/* Buscador de dirección */}
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Escribí una dirección..."
            placeholderTextColor={c.textSubtle}
            value={direccion}
            onChangeText={handleDireccionChange}
            returnKeyType="search"
          />
          {(buscando || cargandoGPS) && <ActivityIndicator style={styles.searchSpinner} size="small" color={c.accent} />}
        </View>

        {/* Sugerencias */}
        {sugerencias.length > 0 && (
          <View style={styles.sugerencias}>
            {sugerencias.map((item) => (
              <TouchableOpacity
                key={item.place_id}
                style={styles.sugerenciaItem}
                onPress={() => elegirSugerencia(item)}
              >
                <Text style={styles.sugerenciaTexto} numberOfLines={2}>
                  📍 {item.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Mapa Leaflet */}
        <View
          style={styles.mapaContainer}
          onTouchStart={() => setScrollEnabled(false)}
          onTouchEnd={() => setScrollEnabled(true)}
        >
          <WebView
            ref={webViewRef}
            source={{ html: mapHTML }}
            style={styles.mapa}
            onMessage={handleMapMessage}
            onLoad={() => setMapListo(true)}
            scrollEnabled={false}
            bounces={false}
            javaScriptEnabled
            domStorageEnabled
          />
        </View>
        <Text style={styles.mapaHint}>Tocá el mapa o arrastrá el pin para ajustar la ubicación</Text>

        {/* Barrio */}
        <Text style={styles.label}>
          Barrio <Text style={styles.opcional}>(opcional)</Text>
        </Text>
        <TouchableOpacity style={styles.barrioBtn} onPress={() => setShowBarrioModal(true)}>
          <Text style={[styles.barrioBtnText, !barrioNombre && styles.barrioBtnPlaceholder]}>
            {barrioNombre || 'Seleccionar barrio...'}
          </Text>
          <Text style={styles.barrioBtnIcon}>▼</Text>
        </TouchableOpacity>

        {/* Foto */}
        <Text style={styles.label}>
          Foto <Text style={styles.opcional}>(opcional)</Text>
        </Text>
        <View style={styles.fotoRow}>
          <TouchableOpacity style={styles.fotoBtn} onPress={tomarFoto}>
            <Text style={styles.fotoBtnIcon}>📷</Text>
            <Text style={styles.fotoBtnText}>Cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fotoBtn} onPress={elegirFoto}>
            <Text style={styles.fotoBtnIcon}>🖼️</Text>
            <Text style={styles.fotoBtnText}>Galería</Text>
          </TouchableOpacity>
        </View>
        {fotoUri && (
          <View style={styles.previewWrapper}>
            <Image source={{ uri: fotoUri }} style={styles.preview} />
            <TouchableOpacity style={styles.fotoRemove} onPress={() => setFotoUri(null)}>
              <Text style={styles.fotoRemoveText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.btn} onPress={handleEnviar} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enviar reporte</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal barrios */}
      <Modal visible={showBarrioModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Seleccionar barrio</Text>
              <TouchableOpacity onPress={() => setShowBarrioModal(false)}>
                <Text style={styles.modalCerrar}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: null, nombre: 'Sin barrio' }, ...barrios]}
              keyExtractor={(b) => String(b.id)}
              renderItem={({ item: b }) => (
                <TouchableOpacity
                  style={[styles.barrioItem, barrioId === b.id && styles.barrioItemActive]}
                  onPress={() => {
                    setBarrioId(b.id);
                    setBarrioNombre(b.id ? b.nombre : '');
                    setShowBarrioModal(false);
                  }}
                >
                  <Text style={[styles.barrioItemText, barrioId === b.id && styles.barrioItemTextActive]}>
                    {b.id ? `🏘️  ${b.nombre}` : '— Sin barrio'}
                  </Text>
                  {barrioId === b.id && <Text style={styles.barrioCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function mkStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingBottom: 48 },
    header: { fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 6, marginTop: 14 },
    opcional: { fontSize: 13, fontWeight: '400', color: c.textSubtle },
    input: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 14, fontSize: 15, backgroundColor: c.card, color: c.text },
    textarea: { minHeight: 100 },
    error: { backgroundColor: c.dangerLight, color: c.danger, padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 },
    // Categorías
    categorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catBtn: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 10, alignItems: 'center', minWidth: '30%', backgroundColor: c.card },
    catBtnActive: { borderColor: c.accent, backgroundColor: c.accentLight },
    catIcon: { fontSize: 22, marginBottom: 4 },
    catLabel: { fontSize: 11, color: c.textMuted, textAlign: 'center' },
    catLabelActive: { color: c.accent, fontWeight: '600' },
    // Búsqueda
    searchWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: c.border, borderRadius: 10, backgroundColor: c.card },
    searchInput: { flex: 1, padding: 14, fontSize: 15, color: c.text },
    searchSpinner: { marginRight: 12 },
    // Sugerencias
    sugerencias: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 10, marginTop: 4, zIndex: 99, elevation: 8 },
    sugerenciaItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: c.separator },
    sugerenciaTexto: { fontSize: 13, color: c.text },
    // Mapa
    mapaContainer: { height: 230, borderRadius: 12, overflow: 'hidden', marginTop: 8, borderWidth: 1, borderColor: c.border },
    mapa: { flex: 1, backgroundColor: c.card },
    mapaHint: { fontSize: 11, color: c.textSubtle, textAlign: 'center', marginTop: 4, marginBottom: 2 },
    // Barrio
    barrioBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 14, backgroundColor: c.card },
    barrioBtnText: { fontSize: 15, color: c.text, flex: 1 },
    barrioBtnPlaceholder: { color: c.textSubtle },
    barrioBtnIcon: { fontSize: 12, color: c.textSubtle, marginLeft: 8 },
    // Foto
    fotoRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    fotoBtn: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 14, alignItems: 'center', backgroundColor: c.card, gap: 6 },
    fotoBtnIcon: { fontSize: 22 },
    fotoBtnText: { fontSize: 14, color: c.text, fontWeight: '500' },
    previewWrapper: { position: 'relative', marginTop: 12 },
    preview: { width: '100%', height: 200, borderRadius: 10, resizeMode: 'cover' },
    fotoRemove: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
    fotoRemoveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    // Botón
    btn: { backgroundColor: c.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    // Modal barrios
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 32 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: c.border },
    modalTitulo: { fontSize: 17, fontWeight: '700', color: c.text },
    modalCerrar: { fontSize: 18, color: c.textMuted, padding: 4 },
    barrioItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.separator },
    barrioItemActive: { backgroundColor: c.accentLight },
    barrioItemText: { fontSize: 15, color: c.text },
    barrioItemTextActive: { color: c.accent, fontWeight: '600' },
    barrioCheck: { fontSize: 16, color: c.accent, fontWeight: '700' },
  });
}
