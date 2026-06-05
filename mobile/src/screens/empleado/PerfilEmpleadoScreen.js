import { useCallback, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getMiPerfilEmpleado } from '../../models/asignacionModel';
import { navigationRef } from '../../navigation/navigationRef';
import { CATEGORIES } from '../../utils/constants';

export default function PerfilEmpleadoScreen() {
  const { user, signOut } = useAuth();
  const { isDark, toggle, c } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => mkStyles(c), [c]);

  const [perfil, setPerfil]   = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    getMiPerfilEmpleado()
      .then(setPerfil)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []));

  function handleCerrarSesion() {
    Alert.alert('Cerrar sesión', '¿Estás seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut },
    ]);
  }

  const iniciales = user?.avatar || user?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciales}</Text>
        </View>
        <Text style={styles.nombre}>{user?.name}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
        <View style={styles.rolBadge}>
          <Text style={styles.rolText}>Empleado municipal</Text>
        </View>
      </View>

      {/* Stats */}
      {perfil?.stats && (
        <View style={styles.statsCard}>
          <StatItem label="👑 Como líder"   value={perfil.stats.resueltosComoLider}    c={c} />
          <Divider c={c} />
          <StatItem label="👥 Como miembro" value={perfil.stats.participacionesComoMiembro} c={c} />
          <Divider c={c} />
          <StatItem label="✅ Tasa resolución" value={`${perfil.stats.tasaResolucion}%`} c={c} />
          <Divider c={c} />
          <StatItem
            label="⏱ Promedio"
            value={perfil.stats.promedioResolucion !== null ? `${perfil.stats.promedioResolucion}d` : '—'}
            c={c}
          />
          <Divider c={c} />
          <StatItem label="📢 Novedades" value={perfil.stats.totalNovedades} c={c} />
          <Divider c={c} />
          <StatItem label="📊 Avances"   value={perfil.stats.totalAvances}   c={c} />
        </View>
      )}

      {/* En curso */}
      {perfil?.enCurso?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 En curso ({perfil.enCurso.length})</Text>
          {perfil.enCurso.map((r) => {
            const cat = CATEGORIES.find((x) => x.id === r.category) || { icon: '📋', label: r.category };
            return (
              <View key={r.id} style={styles.reporteCard}>
                <View style={styles.reporteTop}>
                  <Text style={styles.reporteCat}>{cat.icon} {cat.label}</Text>
                  <Text style={styles.reporteRol}>{r.esLider ? '👑 Líder' : '👥 Miembro'}</Text>
                </View>
                <Text style={styles.reporteTitulo}>{r.title}</Text>
                {r.barrioNombre ? <Text style={styles.reporteMeta}>📍 {r.barrioNombre}</Text> : null}
                {r.ultimoAvance ? (
                  <Text style={styles.reporteMeta} numberOfLines={1}>
                    {r.ultimoPorcentaje != null ? `${r.ultimoPorcentaje}% · ` : ''}{r.ultimoAvance}
                  </Text>
                ) : null}
                <Text style={styles.reporteDias}>{r.diasTranscurridos}d en curso</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Historial de resueltos */}
      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ✅ Resueltos ({perfil?.resueltos?.length ?? 0})
          </Text>
          {!perfil?.resueltos?.length ? (
            <Text style={styles.emptyText}>Todavía no resolviste ningún reporte.</Text>
          ) : (
            perfil.resueltos.map((r) => {
              const cat = CATEGORIES.find((x) => x.id === r.category) || { icon: '📋', label: r.category };
              return (
                <View key={r.id} style={styles.reporteCard}>
                  <Text style={styles.reporteCat}>{cat.icon} {cat.label}</Text>
                  <Text style={styles.reporteTitulo}>{r.title}</Text>
                  {r.barrioNombre ? <Text style={styles.reporteMeta}>📍 {r.barrioNombre}</Text> : null}
                  <View style={styles.reporteBottom}>
                    <Text style={styles.reporteDias}>
                      {r.diasResolucion !== null ? `${r.diasResolucion}d` : '—'}
                    </Text>
                    <Text style={styles.reporteFecha}>
                      {new Date(r.resueltaEn).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Mensajes al admin */}
      <TouchableOpacity style={styles.mensajesBtn} onPress={() => navigationRef.navigate('Mensajes')}>
        <Text style={styles.mensajesBtnText}>✉️ Mensajes al admin</Text>
        <Text style={styles.mensajesBtnChevron}>›</Text>
      </TouchableOpacity>

      {/* Configuración */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Configuración</Text>
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

function StatItem({ label, value, c }) {
  return (
    <View style={{ alignItems: 'center', flex: 1, paddingVertical: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: c.text }}>{value}</Text>
      <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

function Divider({ c }) {
  return <View style={{ width: 1, backgroundColor: c.separator, marginVertical: 6 }} />;
}

function mkStyles(c) {
  return StyleSheet.create({
    container:  { flex: 1, backgroundColor: c.bg },
    content:    { padding: 16, paddingBottom: 48 },

    avatarWrap: { alignItems: 'center', marginBottom: 20, paddingTop: 12 },
    avatar:     { width: 80, height: 80, borderRadius: 40, backgroundColor: c.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 30, color: '#fff', fontWeight: '700' },
    nombre:     { fontSize: 20, fontWeight: '700', color: c.text, marginBottom: 2 },
    username:   { fontSize: 14, color: c.textMuted, marginBottom: 10 },
    rolBadge:   { backgroundColor: c.accentLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
    rolText:    { color: c.accent, fontWeight: '600', fontSize: 13 },

    statsCard:  { flexDirection: 'row', backgroundColor: c.card, borderRadius: 14, padding: 8, marginBottom: 14, flexWrap: 'wrap' },

    section:      { backgroundColor: c.card, borderRadius: 14, padding: 16, marginBottom: 14 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: c.text, marginBottom: 12 },

    reporteCard:   { backgroundColor: c.bg, borderRadius: 10, padding: 12, marginBottom: 8 },
    reporteTop:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    reporteCat:    { fontSize: 12, color: c.textMuted },
    reporteRol:    { fontSize: 12, color: c.textMuted },
    reporteTitulo: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 2 },
    reporteMeta:   { fontSize: 12, color: c.textMuted, marginBottom: 2 },
    reporteBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    reporteDias:   { fontSize: 12, color: c.accent, fontWeight: '600' },
    reporteFecha:  { fontSize: 12, color: c.textMuted },

    emptyText: { fontSize: 14, color: c.textMuted, fontStyle: 'italic' },

    infoFila:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    infoLabel: { fontSize: 14, color: c.textMuted },
    infoValor: { fontSize: 14, color: c.text, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
    separador: { height: 1, backgroundColor: c.separator },

    mensajesBtn:      { backgroundColor: c.card, borderRadius: 14, padding: 16, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    mensajesBtnText:  { fontSize: 15, fontWeight: '600', color: c.text },
    mensajesBtnChevron: { fontSize: 22, color: c.textMuted },

    logoutBtn:  { borderWidth: 1.5, borderColor: c.danger, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
    logoutText: { color: c.danger, fontWeight: '600', fontSize: 15 },
  });
}
