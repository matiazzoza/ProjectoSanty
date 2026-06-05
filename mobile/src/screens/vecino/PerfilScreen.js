import { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getAll } from '../../models/reporteModel';
import { getByUsuario as getSeguidos } from '../../models/seguimientoModel';
import { CATEGORIES, STATUSES } from '../../utils/constants';

const TABS = ['Mis reportes', 'Apoyados', 'Seguimientos'];

export default function PerfilScreen() {
  const { user, signOut } = useAuth();
  const { isDark, toggle, c } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => mkStyles(c), [c]);

  const [reportes, setReportes]     = useState([]);
  const [seguidosIds, setSeguidosIds] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState(0);

  useFocusEffect(useCallback(() => {
    Promise.all([
      getAll().catch(() => []),
      getSeguidos(user?.id).catch(() => []),
    ]).then(([todos, seguidos]) => {
      setReportes(todos);
      setSeguidosIds(Array.isArray(seguidos) ? seguidos.map((s) => s.id ?? s) : []);
    }).finally(() => setLoading(false));
  }, []));

  function handleCerrarSesion() {
    Alert.alert('Cerrar sesión', '¿Estás seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut },
    ]);
  }

  const misReportes    = reportes.filter((r) => r.authorId === user?.id);
  const apoyados       = reportes.filter((r) => r.votes?.includes(user?.id));
  const seguimientos   = reportes.filter((r) => seguidosIds.includes(r.id));
  const votosRecibidos = misReportes.reduce((acc, r) => acc + (r.votes?.length ?? 0), 0);

  const tabLists = [misReportes, apoyados, seguimientos];
  const tabCounts = [misReportes.length, apoyados.length, seguimientos.length];
  const tabEmpty = ['No publicaste ningún reporte aún.', 'No apoyaste ningún reporte aún.', 'No seguís ningún reporte aún.'];

  const iniciales = user?.avatar || user?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>

      {/* Avatar + nombre */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciales}</Text>
        </View>
      </View>
      <Text style={styles.nombre}>{user?.name}</Text>
      <Text style={styles.username}>@{user?.username}</Text>
      <View style={styles.rolBadge}>
        <Text style={styles.rolText}>Vecino</Text>
      </View>

      {/* Stats */}
      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginBottom: 24 }} />
      ) : (
        <View style={styles.statsCard}>
          <StatItem label="📋 Reportes"        value={misReportes.length}  c={c} />
          <Divider c={c} />
          <StatItem label="👍 Votos recibidos"  value={votosRecibidos}      c={c} />
          <Divider c={c} />
          <StatItem label="🤝 Apoyados"         value={apoyados.length}     c={c} />
          <Divider c={c} />
          <StatItem label="🔔 Seguimientos"     value={seguimientos.length} c={c} />
        </View>
      )}

      {/* Tabs */}
      {!loading && (
        <>
          <View style={styles.tabRow}>
            {TABS.map((t, i) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, activeTab === i && styles.tabBtnActive]}
                onPress={() => setActiveTab(i)}
              >
                <Text style={[styles.tabBtnText, activeTab === i && styles.tabBtnTextActive]}>
                  {t} ({tabCounts[i]})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tabLists[activeTab].length === 0 ? (
            <Text style={styles.emptyText}>{tabEmpty[activeTab]}</Text>
          ) : (
            tabLists[activeTab].map((r) => <ReporteCard key={r.id} r={r} c={c} styles={styles} />)
          )}
        </>
      )}

      {/* Configuración */}
      <View style={styles.infoCard}>
        <View style={styles.infoFila}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValor}>{user?.email || '—'}</Text>
        </View>
        <View style={styles.separador} />
        <View style={styles.infoFila}>
          <Text style={styles.infoLabel}>Usuario</Text>
          <Text style={styles.infoValor}>@{user?.username}</Text>
        </View>
        <View style={styles.separador} />
        <View style={styles.infoFila}>
          <Text style={styles.infoLabel}>Modo oscuro</Text>
          <Switch value={isDark} onValueChange={toggle} trackColor={{ false: '#94a3b8', true: c.accent }} thumbColor="#fff" />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleCerrarSesion}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ReporteCard({ r, c, styles }) {
  const cat = CATEGORIES.find((x) => x.id === r.category) || { icon: '📋', label: r.category };
  const st  = STATUSES.find((x) => x.id === r.status) || { label: r.status, color: '#94a3b8' };
  return (
    <View style={styles.reporteCard}>
      <View style={styles.reporteTop}>
        <Text style={styles.reporteCat}>{cat.icon} {cat.label}</Text>
        <View style={[styles.estadoBadge, { backgroundColor: st.color + '22' }]}>
          <Text style={[styles.estadoText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>
      <Text style={styles.reporteTitulo}>{r.title}</Text>
      <View style={styles.reporteBottom}>
        <Text style={styles.reporteMeta} numberOfLines={1}>📍 {r.address}</Text>
        {r.votes?.length > 0 && <Text style={styles.reporteVotos}>👍 {r.votes.length}</Text>}
      </View>
    </View>
  );
}

function StatItem({ label, value, c }) {
  return (
    <View style={{ alignItems: 'center', flex: 1, paddingVertical: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>{value}</Text>
      <Text style={{ fontSize: 10, color: c.textMuted, marginTop: 2, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}
function Divider({ c }) {
  return <View style={{ width: 1, backgroundColor: c.separator, marginVertical: 6 }} />;
}

function mkStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    content:   { padding: 20, alignItems: 'center', paddingBottom: 48 },

    avatarContainer: { marginBottom: 12 },
    avatar:     { width: 80, height: 80, borderRadius: 40, backgroundColor: c.accent, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 30, color: '#fff', fontWeight: '700' },
    nombre:     { fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 2 },
    username:   { fontSize: 14, color: c.textMuted, marginBottom: 10 },
    rolBadge:   { backgroundColor: c.accentLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 20 },
    rolText:    { color: c.accent, fontWeight: '600', fontSize: 13 },

    statsCard:  { flexDirection: 'row', backgroundColor: c.card, borderRadius: 14, padding: 8, marginBottom: 16, width: '100%' },

    tabRow:         { flexDirection: 'row', width: '100%', backgroundColor: c.border, borderRadius: 12, padding: 4, marginBottom: 12 },
    tabBtn:         { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
    tabBtnActive:   { backgroundColor: c.card },
    tabBtnText:     { fontSize: 12, color: c.textMuted, fontWeight: '500' },
    tabBtnTextActive: { color: c.text, fontWeight: '700' },

    reporteCard:    { backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 8, width: '100%' },
    reporteTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    reporteCat:     { fontSize: 12, color: c.textMuted },
    estadoBadge:    { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
    estadoText:     { fontSize: 11, fontWeight: '600' },
    reporteTitulo:  { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 4 },
    reporteBottom:  { flexDirection: 'row', justifyContent: 'space-between' },
    reporteMeta:    { fontSize: 12, color: c.textMuted, flex: 1 },
    reporteVotos:   { fontSize: 12, color: c.textMuted },
    emptyText:      { fontSize: 14, color: c.textMuted, fontStyle: 'italic', marginBottom: 16 },

    infoCard:   { width: '100%', backgroundColor: c.card, borderRadius: 16, padding: 4, marginTop: 16, marginBottom: 24 },
    infoFila:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    infoLabel:  { fontSize: 14, color: c.textMuted },
    infoValor:  { fontSize: 14, color: c.text, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
    separador:  { height: 1, backgroundColor: c.separator, marginHorizontal: 16 },

    logoutBtn:  { borderWidth: 1.5, borderColor: c.danger, borderRadius: 12, paddingHorizontal: 40, paddingVertical: 14 },
    logoutText: { color: c.danger, fontWeight: '600', fontSize: 15 },
  });
}
