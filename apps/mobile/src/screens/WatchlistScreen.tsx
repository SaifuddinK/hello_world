import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

interface Stock {
  id: number;
  symbol: string;
  name: string;
  current_price: string | null;
  previous_close: string | null;
  change_percent: number | null;
  last_updated: string | null;
}

function fmtPrice(v: string | null) {
  if (!v) return '—';
  const n = parseFloat(v);
  return isNaN(n) ? '—' : `$${n.toFixed(2)}`;
}

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function WatchlistScreen() {
  const { authFetch } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [symbol, setSymbol] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const res = await authFetch('/api/stocks/');
    if (res.ok) setStocks(await res.json());
  }, [authFetch]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  const handleAdd = async () => {
    if (!symbol.trim()) return;
    setAddError(''); setAdding(true);
    try {
      const res = await authFetch('/api/stocks/', {
        method: 'POST',
        body: JSON.stringify({ symbol: symbol.toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.detail ?? 'Failed'); return; }
      setStocks(p => [data, ...p]);
      setSymbol('');
    } finally { setAdding(false); }
  };

  const handleDelete = (sym: string) => {
    Alert.alert('Remove', `Remove ${sym} from watchlist?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        const res = await authFetch(`/api/stocks/${sym}/`, { method: 'DELETE' });
        if (res.ok || res.status === 204) setStocks(p => p.filter(s => s.symbol !== sym));
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Add bar */}
      <View style={styles.addBar}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="US ticker (e.g. NVDA, TSLA)"
          placeholderTextColor="#484f58"
          value={symbol}
          onChangeText={t => { setSymbol(t.toUpperCase()); setAddError(''); }}
          autoCapitalize="characters"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={adding || !symbol.trim()}>
          {adding
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.addBtnText}>Add</Text>
          }
        </TouchableOpacity>
      </View>
      {!!addError && <Text style={styles.errorText}>{addError}</Text>}

      <FlatList
        data={stocks}
        keyExtractor={s => String(s.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#388bfd" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👁️</Text>
            <Text style={styles.emptyTitle}>No symbols watched yet</Text>
            <Text style={styles.emptySubtitle}>Add a US ticker above to start monitoring</Text>
          </View>
        }
        renderItem={({ item: s }) => {
          const up = (s.change_percent ?? 0) > 0;
          const dn = (s.change_percent ?? 0) < 0;
          return (
            <TouchableOpacity
              style={styles.row}
              onLongPress={() => handleDelete(s.symbol)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.symbol}>{s.symbol}</Text>
                <Text style={styles.name} numberOfLines={1}>{s.name || '—'}</Text>
                <Text style={styles.updated}>Updated {fmtTime(s.last_updated)}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.price}>{fmtPrice(s.current_price)}</Text>
                <View style={[styles.badge, up ? styles.badgeGreen : dn ? styles.badgeRed : styles.badgeGray]}>
                  <Text style={[styles.pct, up ? styles.green : dn ? styles.red : styles.muted]}>
                    {up ? '▲' : dn ? '▼' : ''} {up ? '+' : ''}{s.change_percent?.toFixed(2) ?? '—'}%
                  </Text>
                </View>
                <Text style={styles.prevClose}>Prev {fmtPrice(s.previous_close)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c11' },
  addBar: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  input: {
    backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d',
    borderRadius: 10, padding: 12, fontSize: 14, color: '#e6edf3',
  },
  addBtn: { backgroundColor: '#1f6feb', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  errorText: { color: '#f85149', fontSize: 12, paddingHorizontal: 16, marginBottom: 8 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#161b22', paddingHorizontal: 16, paddingVertical: 14,
  },
  rowLeft: { flex: 1, marginRight: 12 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  symbol: { fontSize: 16, fontWeight: '700', color: '#e6edf3', fontFamily: 'monospace' },
  name: { fontSize: 12, color: '#8b949e', marginTop: 2 },
  updated: { fontSize: 11, color: '#484f58', marginTop: 2 },
  price: { fontSize: 17, fontWeight: '700', color: '#e6edf3' },
  prevClose: { fontSize: 11, color: '#484f58' },
  badge: { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  badgeGreen: { backgroundColor: 'rgba(63,185,80,0.12)' },
  badgeRed: { backgroundColor: 'rgba(248,81,73,0.12)' },
  badgeGray: { backgroundColor: 'rgba(139,148,158,0.12)' },
  pct: { fontSize: 12, fontWeight: '600' },
  green: { color: '#3fb950' },
  red: { color: '#f85149' },
  muted: { color: '#484f58' },
  sep: { height: 1, backgroundColor: '#21262d' },
  empty: { paddingTop: 80, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#8b949e' },
  emptySubtitle: { fontSize: 13, color: '#484f58', marginTop: 4 },
});
