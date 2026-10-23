import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export default function Alert({ type = 'info', message, title, onClose, className = '' }) {
  if (!message && !title) return null;

  const styles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      iconText: 'text-blue-600',
      icon: Info
    },
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      iconText: 'text-emerald-600',
      icon: CheckCircle2
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      iconText: 'text-amber-600',
      icon: AlertTriangle
    },
    danger: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-800',
      iconText: 'text-rose-600',
      icon: AlertCircle
    }
  };

  const current = styles[type] || styles.info;
  const Icon = current.icon;

  return (
    <div className={`p-4 rounded-xl border ${current.bg} ${current.border} ${current.text} flex items-start gap-3 shadow-sm ${className}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${current.iconText}`} />
      <div className="flex-1 text-sm">
        {title && <h4 className="font-bold mb-0.5">{title}</h4>}
        <div>{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 text-current/70 hover:text-current transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
