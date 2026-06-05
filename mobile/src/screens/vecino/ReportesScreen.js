import { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAll } from '../../models/reporteModel';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CATEGORIES, STATUSES } from '../../utils/constants';

export default function ReportesScreen({ navigation }) {
  const { user } = useAuth();
  const { c } = useTheme();
  const styles = useMemo(() => mkStyles(c), [c]);

  const [tab, setTab] = useState('tablero');
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('pendiente');

  async function cargar() {
    try {
      const todos = await getAll();
      setReportes(todos);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { cargar(); }, []));

  function getStatus(id) {
    return STATUSES.find((s) => s.id === id) || { label: id, color: '#94a3b8' };
  }
  function getCategory(id) {
    return CATEGORIES.find((cat) => cat.id === id) || { label: id, icon: '📋' };
  }

  const listado = reportes
    .filter((r) => tab === 'mis' ? r.authorId === user.id : true)
    .filter((r) => !filtroCategoria || r.category === filtroCategoria)
    .filter((r) => !filtroEstado || r.status === filtroEstado)
    .filter((r) => !busqueda || r.title?.toLowerCase().includes(busqueda.toLowerCase()) || r.address?.toLowerCase().includes(busqueda.toLowerCase()));

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={c.accent} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'tablero' && styles.tabBtnActive]}
          onPress={() => setTab('tablero')}
        >
          <Text style={[styles.tabBtnText, tab === 'tablero' && styles.tabBtnTextActive]}>🏛️ Tablero</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'mis' && styles.tabBtnActive]}
          onPress={() => setTab('mis')}
        >
          <Text style={[styles.tabBtnText, tab === 'mis' && styles.tabBtnTextActive]}>📋 Mis reportes</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.buscador}
        placeholder="Buscar por título o dirección..."
        placeholderTextColor={c.textSubtle}
        value={busqueda}
        onChangeText={setBusqueda}
        clearButtonMode="while-editing"
      />

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: '', label: 'Todas', icon: '🔍' }, ...CATEGORIES]}
        keyExtractor={(cat) => cat.id}
        style={styles.filtros}
        contentContainerStyle={styles.filtrosContent}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[styles.filtroBtn, filtroCategoria === cat.id && styles.filtroBtnActive]}
            onPress={() => setFiltroCategoria(cat.id)}
          >
            <Text style={[styles.filtroBtnText, filtroCategoria === cat.id && styles.filtroBtnTextActive]}>
              {cat.icon} {cat.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[
          { id: '', label: 'Todos', color: '#94a3b8' },
          { id: 'pendiente',  label: 'Pendiente',   color: '#f59e0b' },
          { id: 'en_proceso', label: 'En proceso',   color: '#3b82f6' },
          { id: 'resuelto',   label: 'Resuelto',     color: '#22c55e' },
        ]}
        keyExtractor={(s) => s.id}
        style={styles.filtros}
        contentContainerStyle={styles.filtrosContent}
        renderItem={({ item: s }) => (
          <TouchableOpacity
            style={[styles.filtroBtn, filtroEstado === s.id && { backgroundColor: s.color, borderColor: s.color }]}
            onPress={() => setFiltroEstado(s.id)}
          >
            <Text style={[styles.filtroBtnText, filtroEstado === s.id && styles.filtroBtnTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {listado.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{tab === 'mis' ? '📭' : '🏙️'}</Text>
          <Text style={styles.emptyText}>
            {tab === 'mis' ? 'No tenés reportes aún.' : 'No hay reportes.'}
          </Text>
          {tab === 'mis' && <Text style={styles.emptyHint}>Tocá "Reportar" para crear uno.</Text>}
        </View>
      ) : (
        <FlatList
          data={listado}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} />}
          renderItem={({ item: r }) => {
            const st = getStatus(r.status);
            const cat = getCategory(r.category);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ReporteDetalle', { reporteId: r.id })}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardCat}>{cat.icon} {cat.label}</Text>
                  <View style={[styles.badge, { backgroundColor: st.color + '22' }]}>
                    <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>{r.title}</Text>
                <Text style={styles.cardDir} numberOfLines={1}>📍 {r.address}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>{new Date(r.createdAt).toLocaleDateString('es-AR')}</Text>
                  {r.votes?.length > 0 && <Text style={styles.cardVotos}>👍 {r.votes.length}</Text>}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

function mkStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg },
    tabRow: { flexDirection: 'row', margin: 16, marginBottom: 8, backgroundColor: c.border, borderRadius: 12, padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabBtnActive: { backgroundColor: c.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    tabBtnText: { fontSize: 14, color: c.textMuted, fontWeight: '500' },
    tabBtnTextActive: { color: c.text, fontWeight: '700' },
    buscador: { marginHorizontal: 16, marginBottom: 8, backgroundColor: c.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: c.border, color: c.text },
    filtros: { flexGrow: 0, height: 44, marginBottom: 4 },
    filtrosContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
    filtroBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, flexShrink: 0 },
    filtroBtnActive: { backgroundColor: c.accent, borderColor: c.accent },
    filtroBtnText: { fontSize: 13, color: c.textMuted },
    filtroBtnTextActive: { color: '#fff', fontWeight: '600' },
    card: { backgroundColor: c.card, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    cardCat: { fontSize: 13, color: c.textMuted },
    badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    cardTitle: { fontSize: 16, fontWeight: '600', color: c.text, marginBottom: 4 },
    cardDir: { fontSize: 13, color: c.textMuted, marginBottom: 6 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    cardDate: { fontSize: 12, color: c.textSubtle },
    cardVotos: { fontSize: 12, color: c.textSubtle },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 17, fontWeight: '600', color: c.text },
    emptyHint: { fontSize: 14, color: c.textMuted, marginTop: 4 },
  });
}
