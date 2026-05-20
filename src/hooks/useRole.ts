import { useEffect, useState } from 'react';
import { getRole, type Role } from '@/lib/roles';

export function useRole(): Role {
  const [role, setRoleState] = useState<Role>(getRole());

  useEffect(() => {
    const handler = () => setRoleState(getRole());
    window.addEventListener('kwapos:role', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('kwapos:role', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return role;
}
