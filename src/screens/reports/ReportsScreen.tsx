import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AppHeader} from '../../components/AppHeader';
import {ErrorState} from '../../components/StateView';
import {useAuth} from '../../context/AuthContext';
import {colors} from '../../theme/colors';
import {PersonalReportView} from './PersonalReportView';

export function ReportsScreen() {
  const {session} = useAuth();
  const userId = session?.id || session?.user_id;
  return (
    <View style={styles.screen}>
      <AppHeader title="Báo cáo" subtitle="Theo dõi tiến độ công việc" />
      <View style={styles.content}>
        {userId
          ? <PersonalReportView userId={userId} userName={session?.fullname || session?.name || 'Của tôi'} />
          : <ErrorState message="Không xác định được người dùng hiện tại." />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {flex: 1},
});
