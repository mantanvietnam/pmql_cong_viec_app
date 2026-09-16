import React from 'react';
import {ErrorState} from '../../components/StateView';
import {useAuth} from '../../context/AuthContext';
import {PersonalReportView} from './PersonalReportView';

export function ReportsScreen() {
  const {session} = useAuth();
  const userId = session?.id || session?.user_id;
  if (!userId) return <ErrorState message="Không xác định được người dùng hiện tại." />;
  return <PersonalReportView userId={userId} userName={session?.fullname || session?.name || 'Của tôi'} />;
}
