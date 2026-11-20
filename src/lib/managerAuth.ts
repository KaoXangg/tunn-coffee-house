export const MANAGER_USERNAME_DOMAIN = 'manager.tunn.local';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,32}$/;

export function isValidIdentifierOrEmail(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  if (value.includes('@')) {
    return EMAIL_REGEX.test(value);
  }
  return USERNAME_REGEX.test(value);
}

export function normalizeLoginIdentifier(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (!value) return '';
  if (value.includes('@')) return value;
  return `${value}@${MANAGER_USERNAME_DOMAIN}`;
}

export function formatAccountIdentifier(email: string): {
  label: string;
  isUsername: boolean;
} {
  const suffix = `@${MANAGER_USERNAME_DOMAIN}`;
  if (email.toLowerCase().endsWith(suffix)) {
    return {
      label: email.slice(0, -suffix.length),
      isUsername: true,
    };
  }
  return {
    label: email,
    isUsername: false,
  };
}
