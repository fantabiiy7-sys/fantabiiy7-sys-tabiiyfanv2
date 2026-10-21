import { useRef } from 'react';

/** Yengil kod muharriri: qator raqamlari, Tab bilan surish, Ctrl+S bilan saqlash */
export default function CodeEditor({ value, onChange, language, onSave, placeholder }) {
  const taRef = useRef(null);
  const gutterRef = useRef(null);
  const lines = (value.match(/\n/g)?.length || 0) + 1;

  function onKeyDown(e) {
    const ta = e.currentTarget;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      onSave?.();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: end } = ta;
      if (e.shiftKey) {
        const lineStart = value.lastIndexOf('\n', s - 1) + 1;
        if (value.slice(lineStart, lineStart + 2) === '  ') {
          const next = value.slice(0, lineStart) + value.slice(lineStart + 2);
          onChange(next);
          requestAnimationFrame(() => ta.setSelectionRange(Math.max(lineStart, s - 2), Math.max(lineStart, end - 2)));
        }
        return;
      }
      const next = value.slice(0, s) + '  ' + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => ta.setSelectionRange(s + 2, s + 2));
    }
    if (e.key === 'Enter') {
      const s = ta.selectionStart;
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      const indent = value.slice(lineStart, s).match(/^\s*/)[0];
      if (indent) {
        e.preventDefault();
        const next = value.slice(0, s) + '\n' + indent + value.slice(ta.selectionEnd);
        onChange(next);
        requestAnimationFrame(() => ta.setSelectionRange(s + 1 + indent.length, s + 1 + indent.length));
      }
    }
  }

  return (
    <div className={`code-editor lang-${language}`}>
      <div className="code-gutter" ref={gutterRef} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      <textarea
        ref={taRef}
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={(e) => {
          if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
        }}
        aria-label={language}
      />
    </div>
  );
}
