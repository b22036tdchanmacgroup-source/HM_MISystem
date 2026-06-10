import React from 'react';
import { X, Link2, Paperclip, Check, Film } from 'lucide-react';
import { isImageAttachmentUrl, isVideoAttachmentUrl } from '../../utils/projectUtils';

export interface TaskFormData {
  title: string;
  progress: number;
  startDate: string;
  endDate: string;
  attachments: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  description: string;
  link: string;
}

interface TaskPanelProps {
  mode: 'new' | 'edit';
  formData: TaskFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskFormData>>;
  titleInputRef: React.RefObject<HTMLInputElement>;
  taskFileInputRef: React.RefObject<HTMLInputElement>;
  taskUrlInput: string;
  setTaskUrlInput: React.Dispatch<React.SetStateAction<string>>;
  taskUploadProgress: number | null;
  taskDragIdx: number | null;
  aggregatedViewerInfo: { url: string; taskId: string | null }[];
  slideIndex: number;
  isRegistering: boolean;
  registerSuccess: boolean;
  onSave: () => void;
  onClose: () => void;
  onEscapeReset: () => void;
  onUpload: (files: File[]) => Promise<void>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onThumbnailDragStart: (e: React.DragEvent, idx: number) => void;
  onThumbnailDragOver: (e: React.DragEvent, idx: number) => void;
  onThumbnailDragEnd: () => void;
  onSlideChange: (idx: number) => void;
}

const TaskPanel: React.FC<TaskPanelProps> = ({
  mode,
  formData,
  setFormData,
  titleInputRef,
  taskFileInputRef,
  taskUrlInput,
  setTaskUrlInput,
  taskUploadProgress,
  taskDragIdx,
  aggregatedViewerInfo,
  slideIndex,
  isRegistering,
  registerSuccess,
  onSave,
  onClose,
  onEscapeReset,
  onUpload,
  onFileChange,
  onThumbnailDragStart,
  onThumbnailDragOver,
  onThumbnailDragEnd,
  onSlideChange,
}) => (
  <div
    className="detail-add-task-panel"
    onKeyDown={e => {
      if (e.ctrlKey && e.key === 'Enter') onSave();
      if (e.key === 'Escape') onEscapeReset();
    }}
  >
    {/* ── 헤더 ── */}
    <div className="panel-header">
      <div className="panel-header-top">
        <h3>{mode === 'edit' ? '업무 정보 수정' : '새 업무 등록'}</h3>
        <button className="panel-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <span className="subtitle">
        {mode === 'edit' ? '업무 정보를 수정한 후 등록을 눌러주세요' : '입력 후 Enter 또는 ↵ 등록'}
      </span>
      <div className="header-divider" />
    </div>

    {/* ── 폼 바디 ── */}
    <div className="panel-body">
      {/* 업무 제목 */}
      <div className="form-group title-field-wrap">
        <label className="label-required">업무 제목</label>
        <input
          ref={titleInputRef}
          type="text"
          maxLength={50}
          value={formData.title}
          onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
          placeholder="업무 제목을 입력하세요"
        />
        <span className="char-counter">{formData.title.length}/50</span>
      </div>

      {/* 업무 상세 내용 */}
      <div className="form-group description-field-wrap">
        <label>업무 상세 내용</label>
        <textarea
          rows={4}
          value={formData.description || ''}
          onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
          placeholder="업무 상세 내용을 입력하세요 (줄바꿈 가능)"
          className="form-textarea"
          style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
        />
      </div>

      {/* 기간 설정 */}
      <div className="form-row">
        <div className="form-group">
          <label>시작일</label>
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              style={{ width: '100%' }}
              value={formData.startDate}
              className={formData.endDate && formData.startDate > formData.endDate ? 'date-error' : ''}
              onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))}
            />
          </div>
        </div>
        <div className="form-group">
          <label>종료일</label>
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              style={{ width: '100%' }}
              value={formData.endDate}
              className={formData.endDate && formData.startDate > formData.endDate ? 'date-error' : ''}
              onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))}
            />
            {formData.endDate && formData.startDate > formData.endDate && (
              <div style={{ position: 'absolute', top: '100%', left: 0, color: '#FF4444', fontSize: '11px', marginTop: '4px' }}>
                종료일은 시작일보다 빠를 수 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 진행률 */}
      <div className="form-group">
        <div className="progress-row-container">
          <label>진행률</label>
          <div className="slider-wrap">
            <input
              type="range"
              min="0" max="100"
              className="custom-slider"
              value={formData.progress}
              onChange={e => setFormData(p => ({ ...p, progress: parseInt(e.target.value) }))}
              onKeyDown={e => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                  setFormData(p => ({ ...p, progress: Math.min(100, p.progress + 1) }));
                } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                  setFormData(p => ({ ...p, progress: Math.max(0, p.progress - 1) }));
                }
              }}
            />
          </div>
          <span className="current-val">{formData.progress}%</span>
        </div>
        <div className="progress-shortcuts">
          {[0, 25, 50, 75, 100].map(val => (
            <button
              key={val}
              className={`shortcut-chip ${formData.progress === val ? 'active' : ''}`}
              onClick={() => setFormData(p => ({ ...p, progress: val }))}
            >
              {val}%
            </button>
          ))}
        </div>
      </div>

      {/* 관련 링크 */}
      <div className="form-group">
        <label>관련 링크 (선택)</label>
        <div style={{ position: 'relative' }}>
          <Link2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
          <input
            type="url"
            className="link-field"
            style={{ width: '100%', textIndent: '20px' }}
            value={formData.link}
            onChange={e => setFormData(p => ({ ...p, link: e.target.value }))}
            placeholder="연결할 URL을 입력하세요 (https://...)"
          />
        </div>
      </div>

      {/* 시안 이미지 첨부 */}
      <div className="form-group">
        <label>시안 이미지 (선택)</label>
        <div
          className="dropzone"
          onClick={() => taskFileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={async e => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) await onUpload(files);
          }}
        >
          {taskUploadProgress !== null ? (
            <div className="upload-progress-container">
              <div className="upload-progress-bar" style={{ width: `${taskUploadProgress}%` }} />
              <span className="upload-progress-text">업로드 중... {taskUploadProgress}%</span>
            </div>
          ) : (
            <>
              <Paperclip size={24} />
              <span>클릭 또는 드래그하여 업로드</span>
            </>
          )}
        </div>

        {/* URL 직접 입력 */}
        <div className="task-url-input-wrap" style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="task-url-input"
            placeholder="이미지 또는 동영상 URL을 입력하세요"
            value={taskUrlInput}
            onChange={e => setTaskUrlInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (taskUrlInput.trim()) {
                  setFormData(p => ({ ...p, attachments: [...p.attachments, taskUrlInput.trim()] }));
                  setTaskUrlInput('');
                }
              }
            }}
            style={{ flex: 1, background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
          />
          <button
            type="button"
            onClick={() => {
              if (taskUrlInput.trim()) {
                setFormData(p => ({ ...p, attachments: [...p.attachments, taskUrlInput.trim()] }));
                setTaskUrlInput('');
              }
            }}
            style={{ padding: '0 16px', background: '#374151', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
          >
            추가
          </button>
        </div>

        <input
          type="file"
          multiple
          accept="image/*,video/*,.mp4,.webm,.ogg,.mov,.m4v,.avi,.mkv,.wmv"
          onChange={onFileChange}
          ref={taskFileInputRef}
          style={{ display: 'none' }}
        />

        {/* 썸네일 그리드 */}
        {formData.attachments.length > 0 && (
          <div className="v-draft-grid" style={{ marginTop: '12px' }}>
            {formData.attachments.map((url, i) => {
              const isSelected = aggregatedViewerInfo[slideIndex]?.url === url;
              return (
                <div
                  key={url}
                  className="v-draft-item"
                  draggable
                  onDragStart={e => onThumbnailDragStart(e, i)}
                  onDragOver={e => onThumbnailDragOver(e, i)}
                  onDragEnd={onThumbnailDragEnd}
                  style={{
                    width: '100%',
                    height: '60px',
                    cursor: taskDragIdx === i ? 'grabbing' : 'grab',
                    border: isSelected ? '2px solid rgb(0 196 113)' : '1px solid #4b5563',
                    boxShadow: isSelected ? 'rgb(0 196 113) 0px 0px 2px' : 'none',
                    transition: 'all 0.15s ease',
                    opacity: taskDragIdx === i ? 0.35 : 1,
                    transform: taskDragIdx === i ? 'scale(0.9)' : 'none',
                  }}
                  onClick={() => {
                    const foundIdx = aggregatedViewerInfo.findIndex(info => info.url === url);
                    if (foundIdx !== -1) onSlideChange(foundIdx);
                  }}
                >
                  {isImageAttachmentUrl(url) ? (
                    <img src={url} alt="draft" />
                  ) : isVideoAttachmentUrl(url) ? (
                    <video
                      key={url}
                      className="v-draft-video"
                      muted playsInline loop controls preload="metadata"
                      onMouseOver={e => e.currentTarget.play()}
                      onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    >
                      <source src={url} type="video/mp4" />
                      <source src={url} type="video/webm" />
                      <source src={url} type="video/ogg" />
                    </video>
                  ) : (
                    <div className="thumb-vid-icon"><Film size={14} /></div>
                  )}
                  <button
                    className="v-draft-del"
                    onClick={e => {
                      e.stopPropagation();
                      setFormData(p => ({ ...p, attachments: p.attachments.filter((_, idx) => idx !== i) }));
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    {/* ── 푸터 ── */}
    <div className="panel-footer">
      <button
        className={`register-btn ${registerSuccess ? 'success-state' : ''}`}
        disabled={!formData.title.trim() || isRegistering}
        onClick={onSave}
      >
        {isRegistering ? (
          <><div className="spinner" /><span>{mode === 'edit' ? '수정 중...' : '등록 중...'}</span></>
        ) : registerSuccess ? (
          <><Check size={20} /><span>{mode === 'edit' ? '업무 수정 완료' : '업무 등록 완료'}</span></>
        ) : (
          mode === 'edit' ? '수정하기' : '등록하기'
        )}
      </button>
    </div>
  </div>
);

export default TaskPanel;
