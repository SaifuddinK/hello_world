import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ScrollView, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

type Exchange = 'US' | 'NSE' | 'BSE';

interface Holding {
  id: number;
  symbol: string;
  exchange: Exchange;
  name: string;
  quantity: string;
  buy_price: string;
  current_price: string | null;
  market_value: number | null;
  pnl: number | null;
  pnl_percent: number | null;
  day_change_percent: number | null;
}

function fmt(v: string | number | null, pfx = '$') {
  if (v === null || v === undefined) return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(n)) return '—';
  return `${pfx}${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PctBadge({ v }: { v: number | null }) {
  if (v === null) return <Text style={styles.muted}>—</Text>;
  const up = v > 0, dn = v < 0;
  return (
    <View style={[styles.badge, up ? styles.badgeGreen : dn ? styles.badgeRed : styles.badgeGray]}>
      <Text style={[styles.badgeText, up ? styles.green : dn ? styles.red : styles.muted]}>
        {up ? '▲' : dn ? '▼' : ''} {up ? '+' : ''}{v.toFixed(2)}%
      </Text>
    </View>
  );
}

const EXCHANGES: Exchange[] = ['US', 'NSE', 'BSE'];
const EX_COLOR: Record<Exchange, string> = { US: '#388bfd', NSE: '#3fb950', BSE: '#e3b341' };
const PFX: Record<Exchange, string> = { US: '$', NSE: '₹', BSE: '₹' };

export default function PortfolioScreen() {
  const { authFetch } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [exchange, setExchange] = useState<Exchange>('US');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const res = await authFetch('/api/holdings/');
    if (res.ok) setHoldings(await res.json());
  }, [authFetch]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  const handleAdd = async () => {
    if (!symbol.trim() || !quantity || !buyPrice) return;
    setAddError(''); setAdding(true);
    try {
      const res = await authFetch('/api/holdings/', {
        method: 'POST',
        body: JSON.stringify({ symbol: symbol.toUpperCase(), exchange, quantity: parseFloat(quantity), buy_price: parseFloat(buyPrice) }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.detail ?? 'Failed to add'); return; }
      setHoldings(p => [data, ...p]);
      setShowModal(false); setSymbol(''); setQuantity(''); setBuyPrice('');
    } finally { setAdding(false); }
  };

  const handleDelete = (id: number, sym: string) => {
    Alert.alert('Remove Holding', `Remove ${sym} from your portfolio?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        const res = await authFetch(`/api/holdings/${id}/`, { method: 'DELETE' });
        if (res.ok || res.status === 204) setHoldings(p => p.filter(h => h.id !== id));
      }},
    ]);
  };

  const totalInvested = holdings.reduce((s, h) => s + parseFloat(h.quantity) * parseFloat(h.buy_price), 0);
  const totalValue = holdings.reduce((s, h) => s + (h.market_value ?? 0), 0);
  const totalPnl = totalValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Summary strip */}
      {holdings.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Invested</Text>
            <Text style={styles.summaryValue}>${totalInvested.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Value</Text>
            <Text style={styles.summaryValue}>${totalValue.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>P&L</Text>
            <Text style={[styles.summaryValue, { color: totalPnl >= 0 ? '#3fb950' : '#f85149' }]}>
              {totalPnl >= 0 ? '+' : '-'}${Math.abs(totalPnl).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Return</Text>
            <Text style={[styles.summaryValue, { color: totalPnlPct >= 0 ? '#3fb950' : '#f85149' }]}>
              {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={holdings}
        keyExtractor={h => String(h.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#388bfd" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No positions yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first holding</Text>
          </View>
        }
        renderItem={({ item: h }) => (
          <TouchableOpacity
            style={styles.row}
            onLongPress={() => handleDelete(h.id, h.symbol)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={styles.symbolRow}>
                <Text style={styles.symbol}>{h.symbol}</Text>
                <View style={[styles.exBadge, { borderColor: EX_COLOR[h.exchange] + '55', backgroundColor: EX_COLOR[h.exchange] + '18' }]}>
                  <Text style={[styles.exText, { color: EX_COLOR[h.exchange] }]}>{h.exchange}</Text>
                </View>
              </View>
              <Text style={styles.company} numberOfLines={1}>{h.name || '—'}</Text>
              <Text style={styles.qty}>{parseFloat(h.quantity).toLocaleString()} shares · Avg {fmt(h.buy_price, PFX[h.exchange])}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.price}>{fmt(h.current_price, PFX[h.exchange])}</Text>
              <PctBadge v={h.pnl_percent} />
              <Text style={styles.dayLabel}>Day: <Text style={[h.day_change_percent !== null && h.day_change_percent >= 0 ? styles.green : styles.red]}>
                {h.day_change_percent !== null ? `${h.day_change_percent >= 0 ? '+' : ''}${h.day_change_percent.toFixed(2)}%` : '—'}
              </Text></Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Position</Text>

            <Text style={styles.label}>Exchange</Text>
            <View style={styles.exSelector}>
              {EXCHANGES.map(ex => (
                <TouchableOpacity
                  key={ex}
                  style={[styles.exOption, exchange === ex && { backgroundColor: EX_COLOR[ex] + '28', borderColor: EX_COLOR[ex] }]}
                  onPress={() => setExchange(ex)}
                >
                  <Text style={[styles.exOptionText, exchange === ex && { color: EX_COLOR[ex] }]}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Symbol</Text>
            <TextInput style={styles.input} placeholder={exchange === 'US' ? 'e.g. AAPL' : 'e.g. RELIANCE'}
              placeholderTextColor="#484f58" value={symbol}
              onChangeText={t => { setSymbol(t.toUpperCase()); setAddError(''); }}
              autoCapitalize="characters" />

            <Text style={styles.label}>Quantity</Text>
            <TextInput style={styles.input} placeholder="10" placeholderTextColor="#484f58"
              value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />

            <Text style={styles.label}>Buy Price ({PFX[exchange]})</Text>
            <TextInput style={styles.input} placeholder="150.00" placeholderTextColor="#484f58"
              value={buyPrice} onChangeText={setBuyPrice} keyboardType="decimal-pad" />

            {!!addError && <Text style={styles.errorText}>{addError}</Text>}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowModal(false); setAddError(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={adding}>
                {adding ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addBtnText}>Add</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c11' },
  summaryRow: { flexDirection: 'row', padding: 12, gap: 8 },
  summaryCard: {
    flex: 1, backgroundColor: '#161b22', borderRadius: 12,
    borderWidth: 1, borderColor: '#30363d', padding: 10, alignItems: 'center',
  },
  summaryLabel: { fontSize: 9, color: '#484f58', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 12, fontWeight: '700', color: '#e6edf3', marginTop: 2 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: '#161b22', paddingHorizontal: 16, paddingVertical: 14,
  },
  rowLeft: { flex: 1, marginRight: 12 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  symbolRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  symbol: { fontSize: 15, fontWeight: '700', color: '#e6edf3', fontFamily: 'monospace' },
  exBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  exText: { fontSize: 9, fontWeight: '700' },
  company: { fontSize: 12, color: '#8b949e', marginBottom: 2 },
  qty: { fontSize: 11, color: '#484f58' },
  price: { fontSize: 15, fontWeight: '700', color: '#e6edf3' },
  dayLabel: { fontSize: 11, color: '#484f58' },
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeGreen: { backgroundColor: 'rgba(63,185,80,0.12)' },
  badgeRed: { backgroundColor: 'rgba(248,81,73,0.12)' },
  badgeGray: { backgroundColor: 'rgba(139,148,158,0.12)' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  green: { color: '#3fb950' },
  red: { color: '#f85149' },
  muted: { color: '#484f58' },
  sep: { height: 1, backgroundColor: '#21262d' },
  empty: { paddingTop: 80, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#8b949e' },
  emptySubtitle: { fontSize: 13, color: '#484f58', marginTop: 4 },
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#1f6feb', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#388bfd', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#161b22', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderColor: '#30363d', padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#e6edf3', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '600', color: '#484f58', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  exSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  exOption: {
    flex: 1, borderWidth: 1, borderColor: '#30363d', borderRadius: 8,
    paddingVertical: 8, alignItems: 'center',
  },
  exOptionText: { fontSize: 13, fontWeight: '600', color: '#8b949e' },
  input: {
    backgroundColor: '#0d1117', borderWidth: 1, borderColor: '#30363d',
    borderRadius: 10, padding: 12, fontSize: 14, color: '#e6edf3', marginBottom: 14,
  },
  errorText: { color: '#f85149', fontSize: 13, marginBottom: 8 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#30363d', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: '#8b949e', fontSize: 15, fontWeight: '600' },
  addBtn: { flex: 1, backgroundColor: '#1f6feb', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
