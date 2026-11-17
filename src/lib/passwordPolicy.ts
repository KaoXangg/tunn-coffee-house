/**
 * World-class Admin Password Policy (NIST SP 800-63B + OWASP ASVS Level 2 aligned)
 * - Minimum 12 characters, maximum 128 characters
 * - All 4 character classes required (uppercase, lowercase, digit, symbol)
 * - Blocks common breached/guessable passwords, repeated chars, and email local-part
 */

export const MIN_STRONG_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  'admin123',
  'admin123456',
  'admin@123',
  '123456789012',
  'qwerty123456',
  'tunncoffee',
  'tunncoffeehouse',
  'iloveyou',
  'welcome123',
  'letmein123',
  'changeme123',
]);

export interface PasswordEvaluation {
  valid: boolean;
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  errorMessage: string | null;
  checks: {
    minLength: boolean;
    maxLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasDigit: boolean;
    hasSymbol: boolean;
    notCommon: boolean;
  };
}

export function evaluatePasswordStrength(
  password: string,
  email?: string
): PasswordEvaluation {
  const lower = password.toLowerCase();
  const minLength = password.length >= MIN_STRONG_PASSWORD_LENGTH;
  const maxLength = password.length <= MAX_PASSWORD_LENGTH;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(password);

  const emailLocal = email?.split('@')[0]?.toLowerCase().trim() || '';
  const containsEmail = emailLocal.length >= 3 && lower.includes(emailLocal);
  const hasLongRepeat = /(.)\1{3,}/.test(password);
  const isKnownWeak =
    COMMON_WEAK_PASSWORDS.has(lower) ||
    lower.includes('admin123') ||
    lower.includes('password') ||
    lower.includes('123456');

  const notCommon =
    password.length > 0 && !containsEmail && !hasLongRepeat && !isKnownWeak;

  const passedCount = [
    minLength,
    hasUpper,
    hasLower,
    hasDigit,
    hasSymbol,
    notCommon,
  ].filter(Boolean).length;

  let score: 0 | 1 | 2 | 3 | 4 = 0;
  if (password.length > 0) {
    if (passedCount <= 2) score = 1;
    else if (passedCount <= 4) score = 2;
    else if (passedCount === 5 || password.length < 14) score = 3;
    else score = 4;
  }

  const label =
    score === 0
      ? 'Chưa nhập'
      : score === 1
      ? 'Yếu'
      : score === 2
      ? 'Trung bình'
      : score === 3
      ? 'Mạnh'
      : 'Rất mạnh';

  const valid =
    minLength &&
    maxLength &&
    hasUpper &&
    hasLower &&
    hasDigit &&
    hasSymbol &&
    notCommon;

  let errorMessage: string | null = null;
  if (!minLength) {
    errorMessage = `Mật khẩu cần tối thiểu ${MIN_STRONG_PASSWORD_LENGTH} ký tự (chuẩn OWASP/NIST).`;
  } else if (!maxLength) {
    errorMessage = `Mật khẩu không được vượt quá ${MAX_PASSWORD_LENGTH} ký tự.`;
  } else if (!hasUpper || !hasLower || !hasDigit || !hasSymbol) {
    errorMessage =
      'Mật khẩu phải gồm đủ 4 nhóm: chữ HOA, chữ thường, chữ số và ký tự đặc biệt (VD: !@#$%).';
  } else if (!notCommon) {
    errorMessage =
      'Mật khẩu quá dễ đoán (chứa từ phổ biến, lặp ký tự hoặc trùng tên email).';
  }

  return {
    valid,
    score,
    label,
    errorMessage,
    checks: {
      minLength,
      maxLength,
      hasUpper,
      hasLower,
      hasDigit,
      hasSymbol,
      notCommon,
    },
  };
}

function secureRandomIndex(max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

export function generateStrongPassword(length = 16): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*_-+=?';
  const all = upper + lower + digits + symbols;

  const chars: string[] = [
    upper[secureRandomIndex(upper.length)],
    lower[secureRandomIndex(lower.length)],
    digits[secureRandomIndex(digits.length)],
    symbols[secureRandomIndex(symbols.length)],
  ];

  for (let i = chars.length; i < Math.max(length, MIN_STRONG_PASSWORD_LENGTH); i++) {
    chars.push(all[secureRandomIndex(all.length)]);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomIndex(i + 1);
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }

  return chars.join('');
}
