import { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getAll, marcarLeida } from '../../models/notificacionModel';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { navigationRef } from '../../navigation/navigationRef';

export default function NotificacionesScreen({ navigation }) {
  const { user } = useAuth();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => mkStyles(c), [c]);

  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function cargar() {
    try {
      const data = await getAll(user.id);
      setNotificaciones(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { cargar(); }, []));

  async function handleTocar(notif) {
    if (!notif.leida) {
      await marcarLeida(notif.id).catch(() => {});
      setNotificaciones((prev) => prev.map((n) => n.id === notif.id ? { ...n, leida: 1 } : n));
    }
    const link = notif.link ?? '';

    if (link.startsWith('/reporte/')) {
      // Soporta /reporte/:id  y  /reporte/:id/novedad/:novedadId
      const match = link.match(/^\/reporte\/([^/]+)(?:\/novedad\/([^/]+))?$/);
      if (match) {
        const reporteId      = match[1];
        const scrollToNovedad = match[2] ?? null;
        if (user?.role === 'empleado') {
          navigationRef.navigate('ReporteEmpleado', { reporteId, scrollToNovedad: scrollToNovedad ?? null });
        } else {
          navigation.navigate('ReportesTab', { screen: 'ReporteDetalle', params: { reporteId } });
        }
      }
    } else if (link === '/panel-empleado') {
      // Notificaciones antiguas sin reporteId — solo volver a la lista
      navigation.navigate('Asignaciones', { screen: 'MisAsignaciones' });
    }
  }

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={c.accent} /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Notificaciones</Text>
        {noLeidas > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{noLeidas} nuevas</Text>
          </View>
        )}
      </View>

      {notificaciones.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>No tenés notificaciones.</Text>
        </View>
      ) : (
        <FlatList
          data={notificaciones}
          keyExtractor={(n) => n.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} />}
          renderItem={({ item: n }) => (
            <TouchableOpacity
              style={[styles.item, !n.leida && styles.itemNoLeido]}
              onPress={() => handleTocar(n)}
            >
              {!n.leida && <View style={styles.dot} />}
              <View style={styles.itemContent}>
                <Text style={styles.itemTexto}>{n.mensaje}</Text>
                <Text style={styles.itemFecha}>{new Date(n.creadoEn).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function mkStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8, gap: 10 },
    titulo: { fontSize: 22, fontWeight: '700', color: c.text },
    badge: { backgroundColor: c.accent, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    item: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: c.card, marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    itemNoLeido: { backgroundColor: c.accentLight, borderLeftWidth: 3, borderLeftColor: c.accent },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent, marginTop: 6, marginRight: 10 },
    itemContent: { flex: 1 },
    itemTexto: { fontSize: 14, color: c.text, lineHeight: 20, marginBottom: 4 },
    itemFecha: { fontSize: 12, color: c.textSubtle },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 17, fontWeight: '600', color: c.text },
  });
}
