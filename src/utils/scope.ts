import {MemberScope} from '../types/models';

export const getScopeOrganizationId = (scope: MemberScope) => scope.organizationId;

export const getScopeLabel = (scope: MemberScope) =>
  scope.type === 'organization' ? 'tổ chức' : scope.type === 'department' ? 'phòng ban' : 'dự án';
