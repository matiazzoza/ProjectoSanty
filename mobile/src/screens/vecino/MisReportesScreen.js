import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAll } from '../../models/reporteModel';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, STATUSES } from '../../utils/constants';

export default function MisReportesScreen({ navigation }) {
  const { user } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function cargar() {
    try {
      const todos = await getAll();
      setReportes(todos.filter((r) => r.authorId === user.id));
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { cargar(); }, []));

  function getStatus(id) {
    return STATUSES.find((s) => s.id === id) || { label: id, color: '#94a3b8' };
  }
  function getCategory(id) {
    return CATEGORIES.find((c) => c.id === id) || { label: id, icon: '📋' };
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis reportes</Text>
      {reportes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No tenés reportes aún.</Text>
          <Text style={styles.emptyHint}>Tocá "Reportar" para crear uno.</Text>
        </View>
      ) : (
        <FlatList
          data={reportes}
          keyExtractor={(r) => r.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} />}
          renderItem={({ item: r }) => {
            const st = getStatus(r.status);
            const cat = getCategory(r.category);
            return (
              <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ReporteDetalle', { reporteId: r.id })}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardCat}>{cat.icon} {cat.label}</Text>
                  <View style={[styles.badge, { backgroundColor: st.color + '22' }]}>
                    <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>{r.title}</Text>
                <Text style={styles.cardDir} numberOfLines={1}>{r.address}</Text>
                <Text style={styles.cardDate}>{new Date(r.createdAt).toLocaleDateString('es-AR')}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardCat: { fontSize: 13, color: '#64748b' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  cardDir: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  cardDate: { fontSize: 12, color: '#94a3b8' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#1e293b' },
  emptyHint: { fontSize: 14, color: '#64748b', marginTop: 4 },
});
