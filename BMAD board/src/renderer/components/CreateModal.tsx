import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { X } from 'lucide-react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (data: Record<string, string>) => void;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'number';
    required?: boolean;
    options?: { value: string; label: string }[];
    placeholder?: string;
  }[];
}

export default function CreateModal({ isOpen, onClose, title, onSubmit, fields }: CreateModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();
  const innerRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const raf1 = requestAnimationFrame(() => {
        innerRafRef.current = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (innerRafRef.current !== null) {
          cancelAnimationFrame(innerRafRef.current);
          innerRafRef.current = null;
        }
      };
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onSubmit(formData);
      setFormData({});
      onClose();
    } catch (err) {
      console.log('CreateModal submit error:', err);
    }
  };

  return (
    <div className={`fixed inset-0 bg-surface-overlay flex items-center justify-center z-50 transition-opacity duration-200 ease-win11 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-surface-elevated rounded-lg shadow-xl w-full max-w-lg mx-4 transition-all duration-200 ease-modal ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-[0.98]'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 className="text-lg font-semibold text-foreground-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-accent-subtle transition-colors"
          >
            <X size={18} className="text-foreground-tertiary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full px-3 py-2 border border-border-default rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-sm bg-surface-sunken text-foreground-primary"
                />
              ) : field.type === 'select' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                  className="w-full px-3 py-2 border border-border-default rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-sm bg-surface-sunken text-foreground-primary"
                >
                  <option value="">{t('common.select')}</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-border-default rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-sm bg-surface-sunken text-foreground-primary"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground-secondary bg-surface-sunken rounded-md hover:bg-border-default transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-foreground-on-accent bg-accent rounded-md hover:bg-accent-hover transition-colors"
            >
              {t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
