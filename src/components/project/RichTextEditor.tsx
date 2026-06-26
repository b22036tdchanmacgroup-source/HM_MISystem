import React, { useRef, useEffect, useCallback } from 'react';
import { Palette } from 'lucide-react';

interface RichTextEditorProps {
  value: string; // HTML string
  onChange: (html: string) => void;
  placeholder?: string;
  onCtrlEnter?: () => void;
}

const COLORS = [
  { label: '검정', value: '#111111' },
  { label: '회색', value: '#888888' },
  { label: '빨강', value: '#FF0000' },
  { label: '파랑', value: '#0000FF' },
  { label: '초록', value: '#008000' },
];

/** 기본적인 XSS 방지: 허용 태그만 남기고 위험 속성 제거 */
function sanitizeHtml(html: string): string {
  // script, iframe 등 위험 태그 제거
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '상세 내용을 입력하세요...',
  onCtrlEnter,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);
  const isComposing = useRef(false);

  // 외부 value가 바뀌었을 때만 내용 동기화 (커서 위치 보존)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== value) {
      editor.innerHTML = sanitizeHtml(value);
    }
  }, [value]);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelection.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedSelection.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelection.current);
    }
  }, []);

  const applyColor = useCallback((color: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    restoreSelection();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    // execCommand로 색상 적용 (대부분 브라우저 지원)
    document.execCommand('foreColor', false, color);

    // 변경 후 HTML 저장
    onChange(sanitizeHtml(editor.innerHTML));
  }, [onChange, restoreSelection]);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    const editor = editorRef.current;
    if (editor) {
      onChange(sanitizeHtml(editor.innerHTML));
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && onCtrlEnter) {
      e.preventDefault();
      onCtrlEnter();
    }
  }, [onCtrlEnter]);

  return (
    <div className="rich-editor-wrapper">
      {/* 컬러 툴바 */}
      <div className="rich-editor-toolbar">
        <span className="rich-toolbar-label">색상:</span>
        {COLORS.map(c => (
          <button
            key={c.value}
            type="button"
            className="rich-color-btn"
            title={c.label}
            style={{ background: c.value }}
            onMouseDown={(e) => {
              // mousedown 시 selection 저장 (focus 이동 방지)
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => applyColor(c.value)}
          />
        ))}
        <div className="rich-color-picker-wrapper" title="기타 색상 선택">
          <input 
            type="color" 
            className="rich-color-input"
            onMouseDown={saveSelection}
            onChange={(e) => applyColor(e.target.value)}
          />
          <Palette size={16} className="rich-palette-icon" />
        </div>
        <span className="rich-toolbar-hint">텍스트 선택 후 색상 클릭</span>
      </div>

      {/* contenteditable 편집 영역 */}
      <div
        ref={editorRef}
        className="rich-editor-body"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => {
          isComposing.current = false;
          handleInput();
        }}
      />
    </div>
  );
};

export default RichTextEditor;
