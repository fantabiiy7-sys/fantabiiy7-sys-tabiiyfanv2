import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

/**
 * Umumiy modal oyna. Esc yoki fon bosilganda yopiladi, fokus ichida ushlanadi.
 */
export function Modal({ open, onClose, title, icon: Icon, tone = 'blue', children, footer, size }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current?.();
      if (e.key === 'Tab' && ref.current) {
        const els = ref.current.querySelectorAll('button:not(:disabled), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Xavfsiz tugmaga (odatda "Bekor qilish") fokus beriladi
    setTimeout(() => ref.current?.querySelector('[data-autofocus]')?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-root" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} className={`modal ${size ? `modal-${size}` : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head">
          {Icon && (
            <span className={`modal-icon tone-${tone}`}>
              <Icon size={22} />
            </span>
          )}
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          {onClose && (
            <button type="button" className="icon-btn sm modal-x" onClick={onClose} aria-label="close">
              <X size={18} />
            </button>
          )}
        </div>
        {children && <div className="modal-body">{children}</div>}
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

const ConfirmContext = createContext(null);

/**
 * `const confirm = useConfirm(); if (!(await confirm({ text }))) return;`
 * window.confirm bilan bir xil natija (true/false), faqat ko'rinishi boshqa.
 */
export function ConfirmProvider({ children }) {
  const { t } = useI18n();
  const [state, setState] = useState(null);

  const confirm = useCallback(
    (opts = {}) =>
      new Promise((resolve) => {
        setState({ ...opts, resolve });
      }),
    []
  );

  const close = (value) => {
    state?.resolve(value);
    setState(null);
  };

  const danger = state?.danger !== false;
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(state)}
        onClose={() => close(false)}
        title={state?.title || t('admin.confirmTitle')}
        icon={danger ? AlertTriangle : HelpCircle}
        tone={danger ? 'red' : 'blue'}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => close(false)} data-autofocus>
              {state?.cancelLabel || t('admin.cancel')}
            </button>
            <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)}>
              {state?.confirmLabel || t('admin.delete')}
            </button>
          </>
        }
      >
        {state?.text && <p className="modal-text">{state.text}</p>}
        {state?.note && <p className="modal-note small">{state.note}</p>}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  // Provider bo'lmasa — oddiy brauzer oynasi
  return ctx || ((opts = {}) => Promise.resolve(window.confirm([opts.text, opts.note].filter(Boolean).join('\n\n'))));
}
