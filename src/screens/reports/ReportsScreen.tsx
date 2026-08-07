import React, {useCallback, useEffect, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {workApi} from '../../api/workApi';
import {AppHeader} from '../../components/AppHeader';
import {EmptyState, ErrorState, LoadingView} from '../../components/StateView';
import {StatusBadge} from '../../components/StatusBadge';
import {useAuth} from '../../context/AuthContext';
import {colors} from '../../theme/colors';
import {PersonalDashboard} from '../../types/models';
import {formatDateTime} from '../../utils/date';

export function ReportsScreen() {
  const {session} = useAuth();
  const [data, setData] = useState<PersonalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const userId = session?.id || session?.user_id;
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      setData(await workApi.getPersonalDashboard({user_id: userId}));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) return <LoadingView label="Dang tai bao cao..." />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  const cards = [
    ['Tong cong', data?.total_assigned || 0],
    ['Dang xu ly', data?.total_in_progress || 0],
    ['Qua han', data?.total_overdue || 0],
    ['Hoan thanh', data?.total_completed || 0],
  ];

  return (
    <View style={styles.screen}>
      <AppHeader title="Bao cao ca nhan" subtitle="Tong quan hieu suat cong viec" />
      <View style={styles.grid}>
        {cards.map(([label, value]) => (
          <View key={label} style={styles.statCard}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Cong viec gan day</Text>
      <FlatList
        contentContainerStyle={styles.list}
        data={data?.recent_tasks || []}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={<EmptyState title="Chua co cong viec gan day" />}
        renderItem={({item}) => (
          <View style={styles.taskRow}>
            <View style={styles.taskText}>
              <Text style={styles.taskTitle}>{item.name}</Text>
              <Text style={styles.meta}>Han: {formatDateTime(item.end_date)}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  grid: {padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  statCard: {width: '47%', backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border},
  statValue: {fontSize: 28, fontWeight: '900', color: colors.primary},
  statLabel: {fontSize: 13, color: colors.muted, fontWeight: '800', marginTop: 4},
  sectionTitle: {paddingHorizontal: 16, marginTop: 4, fontSize: 16, fontWeight: '900', color: colors.text},
  list: {padding: 16, gap: 10},
  taskRow: {backgroundColor: colors.surface, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: colors.border},
  taskTitle: {fontSize: 15, fontWeight: '900', color: colors.text},
  taskText: {flex: 1},
  meta: {fontSize: 12, color: colors.muted, marginTop: 4},
});
