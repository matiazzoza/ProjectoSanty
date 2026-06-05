import { useCallback, useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMisAsignaciones, getMiEquipo } from '../../models/asignacionModel';
import { useTheme } from '../../context/ThemeContext';
import { CATEGORIES } from '../../utils/constants';
import { navigationRef } from '../../navigation/navigationRef';

const ESTADO_INTERNO = {
  asignado:             { label: 'Asignado',               color: '#f59e0b' },
  en_ejecucion:         { label: 'En ejecución',           color: '#3b82f6' },
  bloqueado:            { label: 'Bloqueado',              color: '#ef4444' },
  pendiente_validacion: { label: 'Pendiente de validación',color: '#8b5cf6' },
  resuelto:             { label: 'Resuelto',               color: '#22c55e' },
};

export default function MisAsignacionesScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => mkStyles(c), [c]);

  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  // Modal equipo
  const [modalVisible, setModalVisible]   = useState(false);
  const [equipoData, setEquipoData]       = useState([]);
  const [equipoLoading, setEquipoLoading] = useState(false);
  const [equipoTitulo, setEquipoTitulo]   = useState('');

  async function cargar() {
    try {
      const data = await getMisAsignaciones();
      setAsignaciones(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { cargar(); }, []));

  async function verEquipo(reporteId, titulo) {
    setEquipoTitulo(titulo);
    setEquipoData([]);
    setEquipoLoading(true);
    setModalVisible(true);
    try {
      const data = await getMiEquipo(reporteId);
      setEquipoData(data);
    } catch {}
    finally { setEquipoLoading(false); }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={c.accent} /></View>;

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.header}>Mis asignaciones</Text>
        {asignaciones.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No tenés asignaciones activas.</Text>
          </View>
        ) : (
          <FlatList
            data={asignaciones}
            keyExtractor={(a) => a.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} />}
            renderItem={({ item: a }) => {
              const cat = CATEGORIES.find((cat) => cat.id === a.category) || { label: a.category, icon: '📋' };
              const est = ESTADO_INTERNO[a.estadoInterno] || { label: a.estadoInterno, color: '#94a3b8' };
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => navigationRef.navigate('ReporteEmpleado', { reporteId: a.reporte_id, esLider: !!a.es_lider })}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.catLabel}>{cat.icon} {cat.label}</Text>
                    {a.es_lider
                      ? <Text style={styles.liderBadge}>👑 Líder</Text>
                      : <Text style={styles.miembroBadge}>👥 Miembro</Text>}
                  </View>
                  <Text style={styles.titulo}>{a.title}</Text>
                  <Text style={styles.dir} numberOfLines={1}>📍 {a.address}</Text>

                  <View style={styles.bottomRow}>
                    <View style={[styles.estadoBadge, { backgroundColor: est.color + '22' }]}>
                      <Text style={[styles.estadoText, { color: est.color }]}>{est.label}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.equipoChip}
                      onPress={(e) => { e.stopPropagation(); verEquipo(a.reporte_id, a.title); }}
                    >
                      <Text style={styles.equipoChipText}>
                        👥 Equipo {a.totalMiembros > 0 ? `(${a.totalMiembros})` : ''}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {a.fechaLimite && (
                    <Text style={styles.fecha}>⏰ Vence: {new Date(a.fechaLimite).toLocaleDateString('es-AR')}</Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Modal equipo */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👥 Equipo</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle} numberOfLines={1}>{equipoTitulo}</Text>

            {equipoLoading ? (
              <ActivityIndicator color={c.accent} style={{ marginTop: 24 }} />
            ) : equipoData.length === 0 ? (
              <Text style={styles.emptyEquipo}>Sin miembros cargados.</Text>
            ) : (
              equipoData.map((m) => (
                <View key={m.id} style={styles.miembroCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{m.empleado_avatar || (m.empleado_nombre?.[0] ?? '?')}</Text>
                  </View>
                  <View style={styles.miembroInfo}>
                    <Text style={styles.miembroNombre}>{m.empleado_nombre}</Text>
                    {m.especialidades?.length > 0 && (
                      <Text style={styles.especialidades}>{m.especialidades.join(' · ')}</Text>
                    )}
                  </View>
                  {m.es_lider
                    ? <Text style={styles.liderBadge}>👑 Líder</Text>
                    : <Text style={styles.miembroBadge}>👥 Miembro</Text>}
                </View>
              ))
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

function mkStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg },
    header: { fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 16 },
    card: { backgroundColor: c.card, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    catLabel: { fontSize: 13, color: c.textMuted },
    liderBadge: { fontSize: 12, color: '#92400e', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    miembroBadge: { fontSize: 12, color: '#1e40af', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    titulo: { fontSize: 16, fontWeight: '600', color: c.text, marginBottom: 4 },
    dir: { fontSize: 13, color: c.textMuted, marginBottom: 10 },
    bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    estadoBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    estadoText: { fontSize: 12, fontWeight: '600' },
    equipoChip: { borderWidth: 1, borderColor: c.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: c.bg },
    equipoChipText: { fontSize: 12, color: c.text },
    fecha: { fontSize: 12, color: '#f59e0b', marginTop: 8 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 17, fontWeight: '600', color: c.text },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: c.text },
    modalClose: { fontSize: 20, color: c.textMuted, paddingHorizontal: 4 },
    modalSubtitle: { fontSize: 13, color: c.textMuted, marginBottom: 16 },
    emptyEquipo: { fontSize: 14, color: c.textMuted, fontStyle: 'italic', marginTop: 12 },
    miembroCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.separator },
    avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { fontSize: 15, fontWeight: '700', color: c.accent },
    miembroInfo: { flex: 1 },
    miembroNombre: { fontSize: 14, fontWeight: '600', color: c.text },
    especialidades: { fontSize: 12, color: c.textMuted, marginTop: 1 },
  });
}
