import React from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../navigation/types';
import {PersonalReportView} from './PersonalReportView';

type Props = NativeStackScreenProps<AppStackParamList, 'MemberReport'>;

export function MemberReportScreen({route}: Props) {
  return <PersonalReportView userId={route.params.userId} userName={route.params.userName} defaultOrganizationId={route.params.organizationId} />;
}
