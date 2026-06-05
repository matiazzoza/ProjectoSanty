import { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { getById, toggleVote, addComment, deleteComment, getHistorial } from '../../models/reporteModel';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CATEGORIES, STATUSES } from '../../utils/constants';
import { buildMapHTML } from '../../utils/mapHTML';

export default function ReporteDetalleScreen({ route }) {
  const { reporteId } = route.params;
  const { user } = useAuth();
  const { c } = useTheme();
  const styles = useMemo(() => mkStyles(c), [c]);

  const [reporte, setReporte] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    try {
      const [r, h] = await Promise.all([getById(reporteId), getHistorial(reporteId)]);
      setReporte(r);
      setHistorial(h);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  async function handleVoto() {
    try {
      await toggleVote(reporteId, user.id);
      await cargar();
    } catch (err) { Alert.alert('Error', err.message); }
  }

  async function handleComentario() {
    if (!comentario.trim()) return;
    setEnviando(true);
    try {
      await addComment(reporteId, { text: comentario, authorId: user.id });
      setComentario('');
      await cargar();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setEnviando(false); }
  }

  async function handleBorrarComentario(commentId) {
    Alert.alert('Eliminar comentario', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await deleteComment(reporteId, commentId); await cargar(); }
        catch (err) { Alert.alert('Error', err.message); }
      }},
    ]);
  }

  function getStatusLabel(id) {
    return STATUSES.find((s) => s.id === id)?.label || id;
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={c.accent} /></View>;
  if (!reporte) return <View style={styles.center}><Text style={styles.text}>Reporte no encontrado.</Text></View>;

  const st = STATUSES.find((s) => s.id === reporte.status) || { label: reporte.status, color: '#94a3b8' };
  const cat = CATEGORIES.find((cat) => cat.id === reporte.category) || { label: reporte.category, icon: '📋' };
  const yaVote = reporte.votes?.includes(user.id);
  const lat = reporte.location?.lat ?? reporte.lat;
  const lng = reporte.location?.lng ?? reporte.lng;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.statusBanner, { backgroundColor: st.color + '22', borderColor: st.color }]}>
        <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
      </View>

      {reporte.status === 'cancelado' && reporte.motivoCancelacion && (
        <View style={styles.cancelBanner}>
          <Text style={styles.cancelTitle}>❌ Reporte cancelado</Text>
          <Text style={styles.cancelMotivo}>Motivo: {reporte.motivoCancelacion}</Text>
        </View>
      )}

      <Text style={styles.titulo}>{reporte.title}</Text>
      <Text style={styles.meta}>{cat.icon} {cat.label}  ·  {new Date(reporte.createdAt).toLocaleDateString('es-AR')}</Text>
      <Text style={styles.dir}>📍 {reporte.address}{reporte.barrioNombre ? `, ${reporte.barrioNombre}` : ''}</Text>

      {lat && lng && (
        <View style={styles.mapContainer}>
          <WebView
            source={{ html: buildMapHTML(lat, lng, false) }}
            style={styles.map}
            scrollEnabled={false}
            javaScriptEnabled
            originWhitelist={['*']}
          />
        </View>
      )}

      {reporte.photo && <Image source={{ uri: reporte.photo }} style={styles.foto} />}

      <Text style={styles.descripcion}>{reporte.description}</Text>

      <TouchableOpacity style={[styles.votoBtn, yaVote && styles.votoBtnActive]} onPress={handleVoto}>
        <Text style={[styles.votoBtnText, yaVote && { color: c.accent }]}>{yaVote ? '👍 Votado' : '👍 Votar'} · {reporte.votes?.length ?? 0}</Text>
      </TouchableOpacity>

      {historial.length > 0 && (
        <View style={styles.seccion}>
          <Text style={styles.seccionTitle}>Historial</Text>
          {historial.map((h, i) => (
            <View key={i} style={styles.historialItem}>
              <Text style={styles.historialText}>
                {getStatusLabel(h.estado_anterior)} → {getStatusLabel(h.estado_nuevo)}
              </Text>
              <Text style={styles.historialFecha}>
                {h.cambiado_en ? new Date(h.cambiado_en).toLocaleDateString('es-AR') : '—'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.seccion}>
        <Text style={styles.seccionTitle}>Comentarios ({reporte.comments?.length ?? 0})</Text>
        {reporte.comments?.map((com) => (
          <View key={com.id} style={styles.comentario}>
            <View style={styles.comentarioTop}>
              <Text style={styles.comentarioAutor}>{com.authorName || 'Usuario'}</Text>
              {com.authorId === user.id && (
                <TouchableOpacity onPress={() => handleBorrarComentario(com.id)}>
                  <Text style={styles.comentarioBorrar}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.comentarioTexto}>{com.text}</Text>
            <Text style={styles.comentarioFecha}>{new Date(com.createdAt).toLocaleDateString('es-AR')}</Text>
          </View>
        ))}

        <View style={styles.comentarioInput}>
          <TextInput
            style={styles.inputComentario}
            placeholder="Escribí un comentario..."
            placeholderTextColor={c.textSubtle}
            value={comentario}
            onChangeText={setComentario}
            multiline
          />
          <TouchableOpacity style={styles.enviarBtn} onPress={handleComentario} disabled={enviando}>
            {enviando ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.enviarBtnText}>Enviar</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function mkStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg },
    text: { color: c.text },
    statusBanner: { borderWidth: 1, borderRadius: 10, padding: 10, alignItems: 'center', marginBottom: 14 },
    statusText: { fontWeight: '700', fontSize: 15 },
    cancelBanner: { backgroundColor: c.dangerLight, borderRadius: 10, padding: 12, marginBottom: 12 },
    cancelTitle: { fontWeight: '700', color: c.danger, marginBottom: 4 },
    cancelMotivo: { color: c.dangerText, fontSize: 13 },
    titulo: { fontSize: 20, fontWeight: '700', color: c.text, marginBottom: 6 },
    meta: { fontSize: 13, color: c.textMuted, marginBottom: 4 },
    dir: { fontSize: 13, color: c.textMuted, marginBottom: 12 },
    mapContainer: { height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: c.border },
    map: { flex: 1 },
    foto: { width: '100%', height: 200, borderRadius: 12, marginBottom: 14, resizeMode: 'cover' },
    descripcion: { fontSize: 15, color: c.text, lineHeight: 22, marginBottom: 16 },
    votoBtn: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, alignItems: 'center', backgroundColor: c.card, marginBottom: 20 },
    votoBtnActive: { borderColor: c.accent, backgroundColor: c.accentLight },
    votoBtnText: { fontSize: 15, fontWeight: '600', color: c.text },
    seccion: { marginBottom: 20 },
    seccionTitle: { fontSize: 16, fontWeight: '700', color: c.text, marginBottom: 10 },
    historialItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: c.card, borderRadius: 8, padding: 10, marginBottom: 6 },
    historialText: { fontSize: 13, color: c.text, flex: 1, marginRight: 8 },
    historialFecha: { fontSize: 12, color: c.textSubtle },
    comentario: { backgroundColor: c.card, borderRadius: 10, padding: 12, marginBottom: 8 },
    comentarioTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    comentarioAutor: { fontWeight: '600', color: c.text, fontSize: 13 },
    comentarioBorrar: { fontSize: 14 },
    comentarioTexto: { fontSize: 14, color: c.text },
    comentarioFecha: { fontSize: 11, color: c.textSubtle, marginTop: 4 },
    comentarioInput: { flexDirection: 'row', gap: 8, marginTop: 8 },
    inputComentario: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, backgroundColor: c.card, fontSize: 14, maxHeight: 100, color: c.text },
    enviarBtn: { backgroundColor: c.accent, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
    enviarBtnText: { color: '#fff', fontWeight: '600' },
  });
}
