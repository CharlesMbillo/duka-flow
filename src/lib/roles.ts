// Local team access with roles. PIN-protected, stored in localStorage.
// Owner: full access. Salesman: Sell + History only.

export type Role = 'owner' | 'salesman';

const ROLE_KEY = 'kwapos.role';
const PIN_KEY = 'kwapos.ownerPin';
const DEFAULT_PIN = '1234';

export function getRole(): Role {
  const r = localStorage.getItem(ROLE_KEY);
  return r === 'owner' ? 'owner' : 'salesman';
}

export function setRole(role: Role) {
  localStorage.setItem(ROLE_KEY, role);
  window.dispatchEvent(new Event('kwapos:role'));
}

export function getOwnerPin(): string {
  return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}

export function setOwnerPin(pin: string) {
  localStorage.setItem(PIN_KEY, pin);
}

export function verifyOwnerPin(pin: string): boolean {
  return pin === getOwnerPin();
}

export function canAccess(role: Role, path: string): boolean {
  if (role === 'owner') return true;
  // Salesman: only Sell, History, Install
  return /^\/(pos|history|install)?\/?$/.test(path);
}
