import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getMisAsignaciones } from '../../models/asignacionModel';
import { enviarMensaje, getMisMensajes } from '../../models/mensajeModel';
import { navigationRef } from '../../navigation/navigationRef';

const CONTEXTOS = [
  { id: 'reporte', label: '📋 El reporte', desc: 'Tarea, condiciones, materiales' },
  { id: 'equipo',  label: '👥 El equipo',  desc: 'Coordinación, ausencias, conflictos' },
  { id: 'ambos',   label: '🔀 Ambos',      desc: 'Involucra reporte y equipo' },
];

export default function MensajesScreen() {
  const { c } = useTheme();
  const styles = useMemo(() => mkStyles(c), [c]);

  const [asignaciones, setAsignaciones] = useState([]);
  const [mensajes, setMensajes]         = useState([]);
  const [loading, setLoading]           = useState(true);

  const [tipo, setTipo]                         = useState('general');
  const [reporteSeleccionado, setReporteSel]    = useState(null);
  const [contexto, setContexto]                 = useState('');
  const [confirmarReporte, setConfirmarReporte] = useState(false);
  const [texto, setTexto]                       = useState('');
  const [enviando, setEnviando]                 = useState(false);
  const [error, setError]                       = useState('');
  const [pickerVisible, setPickerVisible]       = useState(false);

  useFocusEffect(useCallback(() => {
    Promise.all([
      getMisAsignaciones().catch(() => []),
      getMisMensajes().catch(() => []),
    ]).then(([asig, msgs]) => {
      setAsignaciones(asig);
      setMensajes(msgs);
    }).finally(() => setLoading(false));
  }, []));

  function seleccionarTipo(t) {
    setTipo(t);
    setReporteSel(null);
    setContexto('');
    setConfirmarReporte(false);
    setTexto('');
    setError('');
  }

  function seleccionarReporte(a) {
    setReporteSel(a);
    setContexto('');
    setConfirmarReporte(false);
    setPickerVisible(false);
  }

  const canShowTextArea =
    tipo === 'general' ||
    (tipo === 'reporte' && reporteSeleccionado && contexto &&
      (contexto !== 'reporte' || confirmarReporte));

  async function handleEnviar() {
    if (!texto.trim()) return;
    setEnviando(true);
    setError('');
    try {
      const rId = tipo === 'reporte' ? reporteSeleccionado?.reporte_id : null;
      const ctx = tipo === 'reporte' ? contexto : null;
      const nuevo = await enviarMensaje(texto.trim(), rId, ctx);
      setMensajes((prev) => [nuevo, ...prev]);
      setTexto('');
      seleccionarTipo('general');
      Alert.alert('Enviado', 'Tu mensaje fue enviado al administrador.');
    } catch (err) {
      setError(err.message || 'Error al enviar el mensaje');
    } finally {
      setEnviando(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={c.accent} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* ── Formulario ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✉️ Nuevo mensaje</Text>

        {/* Tipo */}
        <Text style={styles.label}>¿Sobre qué querés escribir?</Text>
        <View style={styles.tipoRow}>
          <TouchableOpacity
            style={[styles.tipoBtn, tipo === 'general' && styles.tipoBtnActive]}
            onPress={() => seleccionarTipo('general')}
          >
            <Text style={[styles.tipoBtnLabel, tipo === 'general' && { color: c.accent }]}>💬 General</Text>
            <Text style={[styles.tipoBtnDesc,  tipo === 'general' && { color: c.accent }]}>Cualquier consulta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tipoBtn, tipo === 'reporte' && styles.tipoBtnActive]}
            onPress={() => seleccionarTipo('reporte')}
          >
            <Text style={[styles.tipoBtnLabel, tipo === 'reporte' && { color: c.accent }]}>📋 Sobre un reporte</Text>
            <Text style={[styles.tipoBtnDesc,  tipo === 'reporte' && { color: c.accent }]}>Vinculado a una asignación</Text>
          </TouchableOpacity>
        </View>

        {/* Picker de reporte */}
        {tipo === 'reporte' && (
          <>
            <Text style={styles.label}>Seleccioná el reporte</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setPickerVisible(true)}>
              <Text style={[styles.pickerText, !reporteSeleccionado && { color: c.textSubtle }]} numberOfLines={1}>
                {reporteSeleccionado ? reporteSeleccionado.title : 'Seleccioná un reporte...'}
              </Text>
              <Text style={styles.pickerChevron}>▼</Text>
            </TouchableOpacity>

            {/* Contexto */}
            {reporteSeleccionado && (
              <>
                <Text style={styles.label}>¿Sobre qué aspecto?</Text>
                {CONTEXTOS.map((ctx) => (
                  <TouchableOpacity
                    key={ctx.id}
                    style={[styles.contextoBtn, contexto === ctx.id && styles.contextoBtnActive]}
                    onPress={() => { setContexto(ctx.id); setConfirmarReporte(false); }}
                  >
                    <Text style={[styles.contextoBtnLabel, contexto === ctx.id && { color: c.accent }]}>{ctx.label}</Text>
                    <Text style={[styles.contextoBtnDesc,  contexto === ctx.id && { color: c.accent }]}>{ctx.desc}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Aviso contexto "reporte" */}
            {contexto === 'reporte' && !confirmarReporte && (
              <View style={styles.aviso}>
                <Text style={styles.avisoTexto}>
                  ⚠️ Las novedades sobre el reporte deberían cargarse en{' '}
                  <Text style={{ fontWeight: '700' }}>Novedades</Text> para quedar registradas oficialmente en el historial.
                </Text>
                <View style={styles.avisoAcciones}>
                  <TouchableOpacity
                    style={styles.avisoBtn}
                    onPress={() => navigationRef.navigate('ReporteEmpleado', {
                      reporteId: reporteSeleccionado.reporte_id,
                      esLider: !!reporteSeleccionado.es_lider,
                    })}
                  >
                    <Text style={styles.avisoBtnPrimaryText}>→ Ir al reporte</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.avisoBtnSecundario}
                    onPress={() => setConfirmarReporte(true)}
                  >
                    <Text style={styles.avisoBtnSecundarioText}>Enviar igual</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* Campo de texto */}
        {canShowTextArea && (
          <>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextInput
              style={styles.textArea}
              placeholder={
                tipo === 'general'
                  ? 'Escribí tu consulta o comentario al administrador...'
                  : contexto === 'equipo'
                  ? 'Describí la situación con el equipo...'
                  : 'Escribí tu mensaje al administrador...'
              }
              placeholderTextColor={c.textSubtle}
              value={texto}
              onChangeText={setTexto}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.enviarBtn, (!texto.trim() || enviando) && { opacity: 0.5 }]}
              onPress={handleEnviar}
              disabled={!texto.trim() || enviando}
            >
              {enviando
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.enviarBtnText}>✉️ Enviar mensaje</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Historial ──────────────────────────────────────── */}
      {mensajes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📨 Mensajes enviados ({mensajes.length})</Text>
          {mensajes.map((m) => (
            <View key={m.id} style={styles.mensajeCard}>
              {m.reporteTitulo && (
                <View style={styles.mensajeReporteRow}>
                  <Text style={styles.mensajeReporteTitulo} numberOfLines={1}>📋 {m.reporteTitulo}</Text>
                  {m.contexto && (
                    <View style={styles.ctxBadge}>
                      <Text style={styles.ctxBadgeText}>
                        {m.contexto === 'equipo' ? '👥 Equipo' : m.contexto === 'ambos' ? '🔀 Ambos' : '📋 Reporte'}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              <Text style={styles.mensajeContenido}>{m.contenido}</Text>
              <View style={styles.mensajeMeta}>
                <Text style={styles.mensajeFecha}>
                  {new Date(m.creadoEn).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={[styles.mensajeEstado, m.leido && styles.mensajeEstadoLeido]}>
                  {m.leido ? '✅ Visto' : '⏳ Sin leer'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Modal picker */}
      <Modal visible={pickerVisible} animationType="slide" transparent onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccioná el reporte</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {asignaciones.length === 0 ? (
              <Text style={styles.emptyText}>No tenés reportes activos asignados.</Text>
            ) : (
              asignaciones.map((a) => (
                <TouchableOpacity
                  key={a.reporte_id}
                  style={[styles.pickerItem, reporteSeleccionado?.reporte_id === a.reporte_id && styles.pickerItemActive]}
                  onPress={() => seleccionarReporte(a)}
                >
                  <Text style={[styles.pickerItemTitle, reporteSeleccionado?.reporte_id === a.reporte_id && { color: c.accent }]}>
                    {a.title}
                  </Text>
                  <Text style={styles.pickerItemMeta}>{a.es_lider ? '👑 Líder' : '👥 Miembro'}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

function mkStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    content:   { padding: 16, paddingBottom: 48 },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg },

    section:      { backgroundColor: c.card, borderRadius: 14, padding: 16, marginBottom: 14 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: c.text, marginBottom: 14 },
    label:        { fontSize: 13, fontWeight: '600', color: c.textMuted, marginBottom: 8, marginTop: 12 },

    tipoRow:        { gap: 8 },
    tipoBtn:        { borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 14, marginBottom: 4 },
    tipoBtnActive:  { borderColor: c.accent, backgroundColor: c.accentLight },
    tipoBtnLabel:   { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 2 },
    tipoBtnDesc:    { fontSize: 12, color: c.textMuted },

    picker:            { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.inputBg },
    pickerText:        { fontSize: 14, color: c.text, flex: 1 },
    pickerChevron:     { fontSize: 11, color: c.textMuted, marginLeft: 8 },

    contextoBtn:       { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, marginBottom: 8 },
    contextoBtnActive: { borderColor: c.accent, backgroundColor: c.accentLight },
    contextoBtnLabel:  { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 2 },
    contextoBtnDesc:   { fontSize: 12, color: c.textMuted },

    aviso:               { backgroundColor: '#fef3c7', borderRadius: 10, padding: 12, marginTop: 8 },
    avisoTexto:          { fontSize: 13, color: '#92400e', lineHeight: 18, marginBottom: 10 },
    avisoAcciones:       { flexDirection: 'row', gap: 8 },
    avisoBtn:            { flex: 1, backgroundColor: c.accent, borderRadius: 8, padding: 10, alignItems: 'center' },
    avisoBtnPrimaryText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    avisoBtnSecundario:  { flex: 1, backgroundColor: c.border, borderRadius: 8, padding: 10, alignItems: 'center' },
    avisoBtnSecundarioText: { fontSize: 13, fontWeight: '600', color: c.textMuted },

    textArea:    { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, fontSize: 14, color: c.text, backgroundColor: c.inputBg, minHeight: 100, textAlignVertical: 'top', marginTop: 12 },
    enviarBtn:   { backgroundColor: c.accent, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 10 },
    enviarBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    error:       { backgroundColor: c.dangerLight ?? '#fee2e2', color: c.danger ?? '#ef4444', padding: 10, borderRadius: 8, marginTop: 8, fontSize: 13 },

    mensajeCard:        { backgroundColor: c.bg, borderRadius: 10, padding: 12, marginBottom: 8 },
    mensajeReporteRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
    mensajeReporteTitulo: { fontSize: 12, color: c.accent, fontWeight: '600', flex: 1 },
    ctxBadge:           { backgroundColor: c.accentLight, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
    ctxBadgeText:       { fontSize: 11, color: c.accent, fontWeight: '600' },
    mensajeContenido:   { fontSize: 14, color: c.text, lineHeight: 20, marginBottom: 8 },
    mensajeMeta:        { flexDirection: 'row', justifyContent: 'space-between' },
    mensajeFecha:       { fontSize: 11, color: c.textMuted },
    mensajeEstado:      { fontSize: 11, color: '#f59e0b', fontWeight: '600' },
    mensajeEstadoLeido: { color: '#22c55e' },
    emptyText:          { fontSize: 14, color: c.textMuted, fontStyle: 'italic' },

    modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
    modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle:     { fontSize: 16, fontWeight: '700', color: c.text },
    modalClose:     { fontSize: 20, color: c.textMuted, paddingHorizontal: 4 },
    pickerItem:      { padding: 14, borderRadius: 10, marginBottom: 6, backgroundColor: c.bg },
    pickerItemActive: { backgroundColor: c.accentLight, borderWidth: 1, borderColor: c.accent },
    pickerItemTitle: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 2 },
    pickerItemMeta:  { fontSize: 12, color: c.textMuted },
  });
}
