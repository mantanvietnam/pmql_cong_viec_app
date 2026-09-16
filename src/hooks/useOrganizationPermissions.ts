import {useCallback, useEffect, useMemo, useState} from 'react';
import {workApi} from '../api/workApi';

export function useOrganizationPermissions(organizationId?: number | null) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(Boolean(organizationId));

  const load = useCallback(async () => {
    if (!organizationId) {
      setPermissions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setPermissions(await workApi.getRolePermissions(organizationId));
    } catch {
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(
    () => ({permissions, loading, hasPermission: (code: string) => permissions.includes(code), reload: load}),
    [load, loading, permissions],
  );

  return value;
}
