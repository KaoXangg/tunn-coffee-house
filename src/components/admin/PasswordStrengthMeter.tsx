import React, { useState } from 'react';
import { Check, Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  evaluatePasswordStrength,
  generateStrongPassword,
  MIN_STRONG_PASSWORD_LENGTH,
} from '../../lib/passwordPolicy';

interface PasswordStrengthMeterProps {
  password: string;
  email?: string;
  onGenerate?: (generated: string) => void;
  showCopy?: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  email,
  onGenerate,
  showCopy = false,
}) => {
  const [copied, setCopied] = useState(false);
  const evaluation = evaluatePasswordStrength(password, email);

  const barColors = [
    'bg-coffee-beige/40',
    'bg-red-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-emerald-700',
  ];

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const criteria = [
    { key: 'minLength', label: `Từ ${MIN_STRONG_PASSWORD_LENGTH} ký tự`, ok: evaluation.checks.minLength },
    { key: 'hasUpper', label: 'Chữ HOA (A–Z)', ok: evaluation.checks.hasUpper },
    { key: 'hasLower', label: 'Chữ thường (a–z)', ok: evaluation.checks.hasLower },
    { key: 'hasDigit', label: 'Chữ số (0–9)', ok: evaluation.checks.hasDigit },
    { key: 'hasSymbol', label: 'Ký tự đặc biệt (!@#$)', ok: evaluation.checks.hasSymbol },
    { key: 'notCommon', label: 'Không dễ đoán / lặp', ok: evaluation.checks.notCommon },
  ];

  return (
    <div className="mt-2.5 p-3 bg-ivory-light/70 border border-coffee-beige/80 rounded-brand space-y-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-coffee" />
          <span className="text-coffee-muted font-medium">Độ mạnh:</span>
          <span
            className={`font-semibold ${
              evaluation.score >= 3
                ? 'text-emerald-700'
                : evaluation.score === 2
                ? 'text-amber-700'
                : evaluation.score === 1
                ? 'text-red-700'
                : 'text-coffee-muted'
            }`}
          >
            {evaluation.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {showCopy && password && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium border border-coffee-beige bg-white text-coffee-dark hover:bg-ivory rounded-brand transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          )}
          {onGenerate && (
            <button
              type="button"
              onClick={() => onGenerate(generateStrongPassword(16))}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-coffee/10 text-coffee hover:bg-coffee hover:text-ivory-light rounded-brand transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Tạo mật khẩu mạnh</span>
            </button>
          )}
        </div>
      </div>

      {/* 4-segment meter */}
      <div className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 rounded-full transition-colors ${
              evaluation.score >= level ? barColors[evaluation.score] : 'bg-coffee-beige/40'
            }`}
          />
        ))}
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-0.5">
        {criteria.map((item) => (
          <div
            key={item.key}
            className={`flex items-center gap-1.5 text-[11px] ${
              item.ok ? 'text-emerald-800 font-medium' : 'text-coffee-muted'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full inline-flex items-center justify-center shrink-0 ${
                item.ok ? 'bg-emerald-600 text-white' : 'bg-coffee-beige/50 text-transparent'
              }`}
            >
              <Check className="w-2.5 h-2.5" />
            </span>
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
