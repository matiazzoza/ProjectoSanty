import { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Image,
  TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import { uriToBase64 } from '../../utils/imageUtils';
import { getById } from '../../models/reporteModel';
import { getMiEquipo, marcarEnEjecucion, proponerCierre } from '../../models/asignacionModel';
import { getByReporte as getAvances } from '../../models/avanceModel';
import { getByReporte as getNovedades, create as crearNovedad } from '../../models/novedadModel';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, STATUSES } from '../../utils/constants';
import { buildMapHTML } from '../../utils/mapHTML';

const ESTADO_INTERNO = {
  asignado:             { label: 'Asignado',               color: '#f59e0b' },
  en_ejecucion:         { label: 'En ejecución',           color: '#3b82f6' },
  bloqueado:            { label: 'Bloqueado',              color: '#ef4444' },
  pendiente_validacion: { label: 'Pendiente de validación',color: '#8b5cf6' },
  resuelto:             { label: 'Resuelto',               color: '#22c55e' },
};

export default function ReporteEmpleadoScreen({ route, navigation }) {
  const { reporteId, esLider: esLiderParam, scrollToNovedad } = route.params;
  const { c, isDark } = useTheme();
  const { user } = useAuth();
  const scrollViewRef      = useRef(null);
  const novedadPositions   = useRef({});
  const novedadesSectionY  = useRef(0);
  const styles = useMemo(() => mkStyles(c), [c]);

  const [reporte, setReporte]     = useState(null);
  const [equipo, setEquipo]       = useState([]);
  const [avances, setAvances]     = useState([]);
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [accionando, setAccionando] = useState(false);

  // Modal novedad
  const [modalVisible, setModalVisible]   = useState(false);
  const [novTipo, setNovTipo]             = useState('informativa');
  const [novDesc, setNovDesc]             = useState('');
  const [novFoto, setNovFoto]             = useState(null);
  const [novLoading, setNovLoading]       = useState(false);
  const [novError, setNovError]           = useState('');

  async function cargar() {
    try {
      const [r, eq, av, nov] = await Promise.all([
        getById(reporteId),
        getMiEquipo(reporteId).catch(() => []),
        getAvances(reporteId).catch(() => []),
        getNovedades(reporteId).catch(() => []),
      ]);
      setReporte(r);
      setEquipo(eq);
      setAvances(av);
      setNovedades(nov);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    if (!loading && scrollToNovedad) {
      setTimeout(() => {
        const cardY = novedadPositions.current[scrollToNovedad];
        if (cardY != null && scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: novedadesSectionY.current + cardY - 16, animated: true });
        }
      }, 600);
    }
  }, [loading]);

  // ── Acciones principales ──────────────────────────────────────

  async function handleIniciarEjecucion() {
    if (!reporte?.photo) {
      Alert.alert('Foto requerida', 'Este reporte no tiene foto inicial. Debés subir una foto del estado actual.', [
        { text: 'Elegir foto', onPress: subirFotoCampo },
        { text: 'Cancelar', style: 'cancel' },
      ]);
      return;
    }
    setAccionando(true);
    try {
      await marcarEnEjecucion(reporteId, null);
      Alert.alert('¡Listo!', 'Reporte marcado en ejecución.');
      cargar();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setAccionando(false); }
  }

  async function subirFotoCampo() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (result.canceled || !result.assets?.length) return;
    setAccionando(true);
    try {
      await marcarEnEjecucion(reporteId, await uriToBase64(result.assets[0].uri));
      Alert.alert('¡Listo!', 'Reporte marcado en ejecución con foto de campo.');
      cargar();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setAccionando(false); }
  }

  async function handleProponerCierre() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso requerido', 'Necesitamos la cámara para la foto de resolución.');
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (result.canceled || !result.assets?.length) return;
    setAccionando(true);
    try {
      await proponerCierre(reporteId, await uriToBase64(result.assets[0].uri));
      Alert.alert('¡Listo!', 'Propuesta de cierre enviada al admin para su validación.');
      cargar();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setAccionando(false); }
  }

  // ── Modal novedad ─────────────────────────────────────────────

  function abrirModalNovedad() {
    setNovTipo('informativa');
    setNovDesc('');
    setNovFoto(null);
    setNovError('');
    setModalVisible(true);
  }

  async function elegirFotoNovedad() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!result.canceled && result.assets?.length > 0) setNovFoto(result.assets[0].uri);
  }

  async function handleEnviarNovedad() {
    if (!novDesc.trim()) return setNovError('La descripción es obligatoria.');
    setNovLoading(true);
    setNovError('');
    try {
      let fotoBase64 = null;
      if (novFoto) {
        fotoBase64 = await uriToBase64(novFoto);
      }
      await crearNovedad(reporteId, { tipo: novTipo, descripcion: novDesc.trim(), foto: fotoBase64 });
      setModalVisible(false);
      const msg = novTipo === 'bloqueante'
        ? 'Novedad bloqueante enviada. El reporte queda pausado hasta que el admin responda.'
        : 'Novedad enviada al admin.';
      Alert.alert('¡Listo!', msg);
      cargar();
    } catch (err) {
      setNovError(err.message);
    } finally {
      setNovLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={c.accent} /></View>;
  if (!reporte) return <View style={styles.center}><Text style={styles.text}>Reporte no encontrado.</Text></View>;

  // Si esLider no viene como param (ej: navegación desde notificaciones), lo determinamos desde el equipo
  const esLider = esLiderParam ?? equipo.some((m) => m.empleado_id === user?.id && !!m.es_lider);

  const st  = STATUSES.find((s) => s.id === reporte.status) || { label: reporte.status, color: '#94a3b8' };
  const cat = CATEGORIES.find((cat) => cat.id === reporte.category) || { label: reporte.category, icon: '📋' };
  const est = ESTADO_INTERNO[reporte.estadoInterno] || { label: reporte.estadoInterno, color: '#94a3b8' };
  const lat = reporte.location?.lat ?? reporte.lat;
  const lng = reporte.location?.lng ?? reporte.lng;

  const puedeAccionar = reporte.estadoInterno === 'en_ejecucion' || reporte.estadoInterno === 'asignado';
  const puedeNovedad  = reporte.estadoInterno === 'en_ejecucion' || reporte.estadoInterno === 'bloqueado';

  return (
    <>
      <ScrollView ref={scrollViewRef} style={styles.container} contentContainerStyle={styles.content}>

        {/* Estado */}
        <View style={styles.badgesRow}>
          <View style={[styles.badge, { backgroundColor: st.color + '22', borderColor: st.color + '66' }]}>
            <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: est.color + '22', borderColor: est.color + '66' }]}>
            <Text style={[styles.badgeText, { color: est.color }]}>{est.label}</Text>
          </View>
        </View>

        <Text style={styles.titulo}>{reporte.title}</Text>
        <Text style={styles.meta}>{cat.icon} {cat.label}</Text>
        <Text style={styles.dir}>📍 {reporte.address}{reporte.barrioNombre ? `, ${reporte.barrioNombre}` : ''}</Text>

        {/* Mapa */}
        {lat && lng && (
          <View style={styles.mapContainer}>
            <WebView
              source={{ html: buildMapHTML(lat, lng, isDark) }}
              style={styles.map}
              scrollEnabled={false}
              javaScriptEnabled
              originWhitelist={['*']}
            />
          </View>
        )}

        {/* Fotos */}
        {reporte.photo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Foto del reporte</Text>
            <Image source={{ uri: reporte.photo }} style={styles.foto} />
          </View>
        )}
        {reporte.fotoCampo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Foto de campo</Text>
            <Image source={{ uri: reporte.fotoCampo }} style={styles.foto} />
          </View>
        )}

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Descripción</Text>
          <Text style={styles.descripcion}>{reporte.description}</Text>
        </View>

        {/* Equipo */}
        {equipo.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Equipo ({equipo.length})</Text>
            {equipo.map((m) => (
              <View key={m.id} style={styles.miembroCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{m.empleado_avatar || (m.empleado_nombre?.[0] ?? '?')}</Text>
                </View>
                <View style={styles.miembroInfo}>
                  <View style={styles.miembroNameRow}>
                    <Text style={styles.miembroName}>{m.empleado_nombre}</Text>
                    {m.es_lider
                      ? <Text style={styles.liderBadge}>👑 Líder</Text>
                      : <Text style={styles.miembroBadge}>👥 Miembro</Text>}
                  </View>
                  {m.especialidades?.length > 0 && (
                    <Text style={styles.especialidades}>{m.especialidades.join(' · ')}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Avances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Avances ({avances.length})</Text>
          {avances.length === 0 ? (
            <Text style={styles.emptyText}>Sin avances registrados aún.</Text>
          ) : (
            [...avances].reverse().map((av, i) => (
              <View key={i} style={styles.avanceCard}>
                <View style={styles.avanceHeader}>
                  <Text style={styles.avanceAutor}>{av.empleado_nombre}</Text>
                  <View style={styles.avanceRight}>
                    {av.porcentaje != null && (
                      <View style={styles.porcentajeBadge}>
                        <Text style={styles.porcentajeText}>{av.porcentaje}%</Text>
                      </View>
                    )}
                    <Text style={styles.avanceFecha}>
                      {av.creado_en
                        ? new Date(av.creado_en).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                        : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.avanceDesc}>{av.descripcion}</Text>
              </View>
            ))
          )}
        </View>

        {/* Novedades */}
        {novedades.length > 0 && (
          <View
            style={styles.section}
            onLayout={(e) => { novedadesSectionY.current = e.nativeEvent.layout.y; }}
          >
            <Text style={styles.sectionTitle}>📢 Novedades ({novedades.length})</Text>
            {[...novedades].reverse().map((nov, i) => {
              const esBloqueante = nov.tipo === 'bloqueante';
              const color = esBloqueante ? c.danger : c.accent;
              const bgColor = esBloqueante ? c.dangerLight : c.accentLight;
              const esTarget = nov.id === scrollToNovedad;
              return (
                <View
                  key={nov.id ?? i}
                  onLayout={(e) => { if (nov.id) novedadPositions.current[nov.id] = e.nativeEvent.layout.y; }}
                  style={[styles.novedadCard, esTarget && styles.novedadHighlight]}
                >
                  <View style={styles.novedadHeader}>
                    <View style={[styles.novedadTipoBadge, { backgroundColor: bgColor }]}>
                      <Text style={[styles.novedadTipoText, { color }]}>
                        {esBloqueante ? '🚨 Bloqueante' : '📝 Informativa'}
                      </Text>
                    </View>
                    <Text style={styles.novedadFecha}>
                      {nov.creado_en
                        ? new Date(nov.creado_en).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                        : ''}
                    </Text>
                  </View>
                  <Text style={styles.novedadAutor}>{nov.empleado_nombre}</Text>
                  <Text style={styles.novedadDesc}>{nov.descripcion}</Text>
                  {nov.foto && <Image source={{ uri: nov.foto }} style={styles.novedadFoto} />}
                  {nov.respuesta_admin ? (
                    <View style={styles.respuestaAdmin}>
                      <Text style={styles.respuestaAdminLabel}>✅ Respuesta del admin</Text>
                      <Text style={styles.respuestaAdminText}>{nov.respuesta_admin}</Text>
                    </View>
                  ) : (
                    <Text style={styles.sinRespuesta}>⏳ Sin respuesta aún</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Acciones */}
        {(esLider || !esLider) && puedeAccionar && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Acciones</Text>

            {/* Iniciar ejecución — solo líder */}
            {esLider && reporte.estadoInterno === 'asignado' && (
              <TouchableOpacity style={styles.btnPrimary} onPress={handleIniciarEjecucion} disabled={accionando}>
                {accionando
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnPrimaryText}>🔧 Iniciar ejecución</Text>}
              </TouchableOpacity>
            )}

            {/* Proponer cierre — solo líder en ejecución */}
            {esLider && reporte.estadoInterno === 'en_ejecucion' && (
              <TouchableOpacity style={styles.btnPrimary} onPress={handleProponerCierre} disabled={accionando}>
                {accionando
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnPrimaryText}>✅ Proponer cierre</Text>}
              </TouchableOpacity>
            )}

            {/* Registrar avance — todos en ejecución */}
            {reporte.estadoInterno === 'en_ejecucion' && (
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => navigation.navigate('RegistrarAvance', { reporteId })}
              >
                <Text style={[styles.btnSecondaryText, { color: c.accent }]}>📊 Registrar avance</Text>
              </TouchableOpacity>
            )}

            {/* Cargar novedad — todos en ejecución o bloqueado */}
            {puedeNovedad && (
              <TouchableOpacity style={styles.btnNovedad} onPress={abrirModalNovedad}>
                <Text style={styles.btnNovedadText}>📢 Cargar novedad</Text>
              </TouchableOpacity>
            )}

            {/* Esperando validación */}
            {esLider && reporte.estadoInterno === 'pendiente_validacion' && (
              <View style={styles.esperandoBanner}>
                <Text style={styles.esperandoText}>⏳ Propuesta de cierre enviada. Esperando validación del admin.</Text>
              </View>
            )}
          </View>
        )}

        {/* Acciones cuando está bloqueado */}
        {reporte.estadoInterno === 'bloqueado' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Acciones</Text>
            <View style={[styles.esperandoBanner, { backgroundColor: c.dangerLight }]}>
              <Text style={[styles.esperandoText, { color: c.danger }]}>🚨 Reporte bloqueado. El admin debe responder la novedad para continuar.</Text>
            </View>
            <TouchableOpacity style={[styles.btnNovedad, { marginTop: 10 }]} onPress={abrirModalNovedad}>
              <Text style={styles.btnNovedadText}>📢 Cargar otra novedad</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Modal cargar novedad */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📢 Cargar novedad</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {novError ? <Text style={styles.error}>{novError}</Text> : null}

            {/* Selector de tipo */}
            <Text style={styles.modalLabel}>Tipo</Text>
            <View style={styles.tipoRow}>
              <TouchableOpacity
                style={[styles.tipoBtn, novTipo === 'informativa' && styles.tipoBtnActive]}
                onPress={() => setNovTipo('informativa')}
              >
                <Text style={[styles.tipoBtnText, novTipo === 'informativa' && styles.tipoBtnTextActive]}>
                  📝 Informativa
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tipoBtn, styles.tipoBtnDanger, novTipo === 'bloqueante' && styles.tipoBtnDangerActive]}
                onPress={() => setNovTipo('bloqueante')}
              >
                <Text style={[styles.tipoBtnText, novTipo === 'bloqueante' && { color: '#fff' }]}>
                  🚨 Bloqueante
                </Text>
              </TouchableOpacity>
            </View>

            {novTipo === 'bloqueante' && (
              <Text style={styles.bloqueaAviso}>⚠️ Esto pausará el reporte hasta que el admin responda.</Text>
            )}

            {/* Descripción */}
            <Text style={styles.modalLabel}>Descripción *</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="Describí la novedad..."
              placeholderTextColor={c.textSubtle}
              value={novDesc}
              onChangeText={setNovDesc}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Foto */}
            <TouchableOpacity style={styles.fotoBtn} onPress={elegirFotoNovedad}>
              <Text style={styles.fotoBtnText}>📷 {novFoto ? 'Cambiar foto' : 'Agregar foto (opcional)'}</Text>
            </TouchableOpacity>
            {novFoto && <Image source={{ uri: novFoto }} style={styles.modalFotoPreview} />}

            {/* Enviar */}
            <TouchableOpacity
              style={[styles.btnPrimary, novTipo === 'bloqueante' && { backgroundColor: c.danger }]}
              onPress={handleEnviarNovedad}
              disabled={novLoading}
            >
              {novLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryText}>Enviar novedad</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function mkStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, paddingBottom: 48 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg },
    text: { color: c.text },

    badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
    badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontSize: 12, fontWeight: '600' },

    titulo: { fontSize: 20, fontWeight: '700', color: c.text, marginBottom: 6 },
    meta: { fontSize: 13, color: c.textMuted, marginBottom: 4 },
    dir: { fontSize: 13, color: c.textMuted, marginBottom: 16 },

    mapContainer: { height: 220, borderRadius: 14, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: c.border },
    map: { flex: 1 },

    section: { backgroundColor: c.card, borderRadius: 14, padding: 16, marginBottom: 14 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: c.text, marginBottom: 12 },

    foto: { width: '100%', height: 200, borderRadius: 10, resizeMode: 'cover' },
    descripcion: { fontSize: 15, color: c.text, lineHeight: 22 },

    miembroCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.separator },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { fontSize: 16, fontWeight: '700', color: c.accent },
    miembroInfo: { flex: 1 },
    miembroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    miembroName: { fontSize: 14, fontWeight: '600', color: c.text, flex: 1 },
    liderBadge: { fontSize: 11, color: '#92400e', backgroundColor: '#fef3c7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
    miembroBadge: { fontSize: 11, color: '#1e40af', backgroundColor: '#eff6ff', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
    especialidades: { fontSize: 12, color: c.textMuted, marginTop: 2 },

    emptyText: { fontSize: 14, color: c.textMuted, fontStyle: 'italic' },

    avanceCard: { backgroundColor: c.bg, borderRadius: 10, padding: 12, marginBottom: 8 },
    avanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    avanceAutor: { fontSize: 13, fontWeight: '600', color: c.text, flex: 1 },
    avanceRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    porcentajeBadge: { backgroundColor: c.accentLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
    porcentajeText: { fontSize: 12, fontWeight: '700', color: c.accent },
    avanceFecha: { fontSize: 11, color: c.textMuted },
    avanceDesc: { fontSize: 14, color: c.text, lineHeight: 20 },

    novedadCard: { backgroundColor: c.bg, borderRadius: 10, padding: 12, marginBottom: 8 },
    novedadHighlight: { borderWidth: 2, borderColor: c.accent, backgroundColor: c.accentLight },
    novedadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    novedadTipoBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    novedadTipoText: { fontSize: 12, fontWeight: '700' },
    novedadFecha: { fontSize: 11, color: c.textMuted },
    novedadAutor: { fontSize: 12, color: c.textMuted, marginBottom: 4 },
    novedadDesc: { fontSize: 14, color: c.text, lineHeight: 20 },
    novedadFoto: { width: '100%', height: 160, borderRadius: 8, marginTop: 8, resizeMode: 'cover' },
    respuestaAdmin: { backgroundColor: c.successLight, borderRadius: 8, padding: 10, marginTop: 8 },
    respuestaAdminLabel: { fontSize: 12, fontWeight: '700', color: c.success, marginBottom: 4 },
    respuestaAdminText: { fontSize: 13, color: c.text },
    sinRespuesta: { fontSize: 12, color: c.textMuted, marginTop: 6, fontStyle: 'italic' },

    btnPrimary: { backgroundColor: c.accent, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
    btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    btnSecondary: { backgroundColor: c.accentLight, borderWidth: 1, borderColor: c.accent, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
    btnSecondaryText: { fontWeight: '600', fontSize: 15 },
    btnNovedad: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10, backgroundColor: c.card },
    btnNovedadText: { fontSize: 15, color: c.text, fontWeight: '500' },
    esperandoBanner: { backgroundColor: c.warningLight, borderRadius: 10, padding: 12, marginBottom: 10 },
    esperandoText: { color: c.warningText, fontSize: 14 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: c.text },
    modalClose: { fontSize: 20, color: c.textMuted, paddingHorizontal: 4 },
    modalLabel: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 8, marginTop: 12 },
    modalInput: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: c.inputBg, color: c.text },
    modalTextarea: { minHeight: 90, textAlignVertical: 'top' },
    modalFotoPreview: { width: '100%', height: 150, borderRadius: 10, marginTop: 10, resizeMode: 'cover' },

    tipoRow: { flexDirection: 'row', gap: 10 },
    tipoBtn: { flex: 1, borderWidth: 1, borderColor: c.accent, borderRadius: 10, padding: 12, alignItems: 'center' },
    tipoBtnActive: { backgroundColor: c.accent },
    tipoBtnDanger: { borderColor: c.danger },
    tipoBtnDangerActive: { backgroundColor: c.danger },
    tipoBtnText: { fontSize: 14, fontWeight: '600', color: c.accent },
    tipoBtnTextActive: { color: '#fff' },
    bloqueaAviso: { fontSize: 12, color: c.danger, marginTop: 8, fontStyle: 'italic' },

    fotoBtn: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, alignItems: 'center', backgroundColor: c.inputBg, marginTop: 8 },
    fotoBtnText: { fontSize: 14, color: c.text },

    error: { backgroundColor: c.dangerLight, color: c.danger, padding: 10, borderRadius: 8, marginBottom: 10, fontSize: 13 },
  });
}
