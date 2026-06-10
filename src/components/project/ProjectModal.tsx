import React from 'react';
import { ChevronDown, X, Trash2, Pin, Edit2, Check } from 'lucide-react';
import type { Project, TeamMember } from '../../types';
import { sortTeamMembers, isImageAttachmentUrl } from '../../utils/projectUtils';
import RichTextEditor from './RichTextEditor';

interface ProjectModalProps {
  mode: 'new' | 'edit';
  formData: Partial<Project>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Project>>>;
  teamMembers: TeamMember[];
  onClose: () => void;
  onSave: () => void;
  isMouseDownOnBackdropRef: React.MutableRefObject<boolean>;
  // PM / 담당자 드롭다운
  openPm: boolean;
  setOpenPm: React.Dispatch<React.SetStateAction<boolean>>;
  pmDropdownRef: React.RefObject<HTMLDivElement>;
  openAssignees: boolean;
  setOpenAssignees: React.Dispatch<React.SetStateAction<boolean>>;
  assigneeDropdownRef: React.RefObject<HTMLDivElement>;
  // 이슈
  isAddingIssue: boolean;
  setIsAddingIssue: React.Dispatch<React.SetStateAction<boolean>>;
  issueInput: string;
  setIssueInput: React.Dispatch<React.SetStateAction<string>>;
  issueDetailInput: string;
  setIssueDetailInput: React.Dispatch<React.SetStateAction<string>>;
  editingIssueIndex: number | null;
  setEditingIssueIndex: React.Dispatch<React.SetStateAction<number | null>>;
  editingIssueText: string;
  setEditingIssueText: React.Dispatch<React.SetStateAction<string>>;
  editingIssueDetail: string;
  setEditingIssueDetail: React.Dispatch<React.SetStateAction<string>>;
  onAddIssue: () => void;
  onUpdateIssue: () => void;
  onPinIssue: (index: number) => void;
  onRemoveIssue: (index: number) => void;
  onStartEditIssue: (index: number, text: string, detail?: string) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  mode,
  formData,
  setFormData,
  teamMembers,
  onClose,
  onSave,
  isMouseDownOnBackdropRef,
  openPm, setOpenPm, pmDropdownRef,
  openAssignees, setOpenAssignees, assigneeDropdownRef,
  isAddingIssue, setIsAddingIssue,
  issueInput, setIssueInput,
  issueDetailInput, setIssueDetailInput,
  editingIssueIndex, setEditingIssueIndex,
  editingIssueText, setEditingIssueText,
  editingIssueDetail, setEditingIssueDetail,
  onAddIssue, onUpdateIssue, onPinIssue, onRemoveIssue, onStartEditIssue,
}) => {
  // 팀원 그룹화 (PM/담당자 드롭다운 공용)
  const sorted = [...teamMembers].sort(sortTeamMembers);
  const leaders     = sorted.filter(tm => tm.role?.includes('팀장') || tm.cell === '기타');
  const uxMembers   = sorted.filter(tm => tm.cell === 'UX셀'  && !tm.role?.includes('팀장'));
  const videoMembers = sorted.filter(tm => tm.cell === '영상셀' && !tm.role?.includes('팀장'));
  const editMembers = sorted.filter(tm => tm.cell === '편집셀' && !tm.role?.includes('팀장'));

  const isOngoing = formData.status === 'ongoing' || formData.status === '진행';

  // ─── 담당자 드롭다운 공용 렌더 헬퍼 ───
  const renderMemberGrid = (
    members: TeamMember[],
    label: string,
    type: 'radio' | 'checkbox',
    checked: (tm: TeamMember) => boolean,
    onChange: (tm: TeamMember, checked: boolean) => void,
    keyPrefix: string
  ) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#8a7d75', borderBottom: '1px solid #eae8e2', padding: '4px', marginBottom: '4px', letterSpacing: '0.5px' }}>{label}</div>
      {members.map(tm => (
        <label key={`${keyPrefix}-${tm.id}`} className="checkbox-label dropdown-item">
          <input
            type={type}
            name={type === 'radio' ? 'projectPm' : undefined}
            checked={checked(tm)}
            onChange={e => onChange(tm, e.target.checked)}
            style={{ marginRight: '6px' }}
          />
          {tm.name}
        </label>
      ))}
    </div>
  );

  return (
    <div
      className="edit-modal-backdrop"
      onMouseDown={e => {
        isMouseDownOnBackdropRef.current = e.target === e.currentTarget;
      }}
      onMouseUp={e => {
        if (e.target === e.currentTarget && isMouseDownOnBackdropRef.current) onClose();
        isMouseDownOnBackdropRef.current = false;
      }}
    >
      <div className="edit-modal" onClick={e => e.stopPropagation()}>

        {/* ── 헤더 ── */}
        <div className="edit-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '28px' }}>
          <h3>{mode === 'edit' ? '업무 정보 수정' : '새 업무 등록'}</h3>
          {mode === 'edit' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isOngoing ? 'pointer' : 'not-allowed', fontSize: '14.5px', fontWeight: 700, color: isOngoing ? '#684e42' : '#a0a0a0', userSelect: 'none' }}>
              <input
                type="checkbox"
                disabled={!isOngoing}
                checked={isOngoing && (formData.isRepresentative || false)}
                onChange={e => setFormData({ ...formData, isRepresentative: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#684e42', cursor: isOngoing ? 'pointer' : 'not-allowed' }}
              />
              <span>대표 업무 지정 {!isOngoing && <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#cc8888', marginLeft: '4px' }}>(진행중인 업무만 설정 가능)</span>}</span>
            </label>
          )}
        </div>

        {/* ── 바디 ── */}
        <div className="edit-modal-body">

          {/* 기본 정보 */}
          <div className="form-section-group basic-info-group">
            <div className="form-split-layout">
              <div className="form-left-panel">
                <div className="form-group">
                  <label>요청 가족사</label>
                  <input type="text" placeholder="가족사를 입력하세요" value={formData.builder || ''} onChange={e => setFormData({...formData, builder: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>협업팀</label>
                  <input type="text" placeholder="협업 부서/팀명" value={formData.collabTeam || ''} onChange={e => setFormData({...formData, collabTeam: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>협업 담당자</label>
                  <input type="text" placeholder="협업 담당자 성함" value={formData.collabManager || ''} onChange={e => setFormData({...formData, collabManager: e.target.value})} />
                </div>
              </div>
              <div className="form-vertical-divider" />
              <div className="form-right-panel form-grid-2col">
                <div className="form-group">
                  <label>프로젝트명</label>
                  <input type="text" placeholder="프로젝트 이름을 입력하세요" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>업무명</label>
                  <input type="text" placeholder="업무명을 입력하세요" value={formData.jobName || ''} onChange={e => setFormData({...formData, jobName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>발주처</label>
                  <input type="text" placeholder="발주처를 입력하세요" value={formData.client || ''} onChange={e => setFormData({...formData, client: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>금액</label>
                  <input type="text" placeholder="금액을 입력하세요 (예: 50,000,000)" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div className="form-group col-span-2">
                  <label>배경 및 목적</label>
                  <textarea placeholder="프로젝트의 배경 및 추진 목적을 입력하세요" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="form-textarea" />
                </div>
              </div>
            </div>
          </div>

          {/* 상태 & 진행률 */}
          <div className="form-section-group status-progress-group">
            <div className="form-row-flex">
              <div className="form-group status-select-field">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label>작업 진행상태</label>
                  {(formData.status === 'completed' || formData.status === '완료') && (
                    <label className="draft-confirmed-label">
                      <input type="checkbox" checked={formData.draftConfirmed || false} onChange={e => setFormData({...formData, draftConfirmed: e.target.checked})} />
                      <span>최근작업</span>
                    </label>
                  )}
                </div>
                <select value={formData.status || 'ongoing'} onChange={e => {
                  const newStatus = e.target.value as any;
                  const ongoing = newStatus === 'ongoing' || newStatus === '진행';
                  setFormData({ ...formData, status: newStatus, isRepresentative: ongoing ? formData.isRepresentative : false });
                }}>
                  <option value="ongoing">진행중 (ongoing)</option>
                  <option value="waiting">대기 (waiting)</option>
                  <option value="holding">홀딩 (holding)</option>
                  <option value="regular">상시 (regular)</option>
                  <option value="completed">완료 (completed)</option>
                </select>
              </div>
              <div className="form-group cell-checkbox-field">
                <label>작업 셀</label>
                <div className="checkbox-group">
                  {['UX셀', '영상셀', '편집셀'].map(cell => (
                    <label key={cell} className="checkbox-label">
                      <input type="checkbox" checked={formData.taskCell?.includes(cell) || false}
                        onChange={e => {
                          const newCells = e.target.checked
                            ? [...(formData.taskCell || []), cell]
                            : (formData.taskCell || []).filter(c => c !== cell);
                          setFormData({...formData, taskCell: newCells});
                        }} />
                      {cell}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group progress-slider-field">
                <label>작업 진행률(%)</label>
                <div className="progress-input-group">
                  <input type="number" value={formData.progress || 0} onChange={e => setFormData({...formData, progress: Number(e.target.value)})} min="0" max="100" className="progress-number" />
                  <input type="range"  value={formData.progress || 0} onChange={e => setFormData({...formData, progress: Number(e.target.value)})} min="0" max="100" step={5} className="progress-slider" />
                </div>
              </div>
            </div>
          </div>

          {/* 일정 & 담당자 */}
          <div className="form-section-group schedule-assignee-group">
            <div className="form-schedule-assignee-split">
              <div className="schedule-left-col">
                <div className="form-group">
                  <label>마감일 <span style={{ fontWeight: 500, fontSize: '12px' }}>(직접 입력 YYYY-MM-DD)</span></label>
                  <input type="text" placeholder="예: 2024-12-31 또는 상시" value={formData.deadline || ''} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>시작일</label>
                  <input type="date" value={formData.startDate || ''} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>종료일</label>
                  <input type="date" value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>

              <div className="assignee-right-col">
                {/* PM 선택 */}
                <div className="form-group pm-select-field">
                  <label>PM</label>
                  <div className="multi-select-dropdown" ref={pmDropdownRef}>
                    <div className={`multi-select-header ${openPm ? 'active' : ''}`} onClick={() => setOpenPm(v => !v)}>
                      <div className="selected-names">{formData.pm || 'PM을 선택하세요...'}</div>
                      <ChevronDown size={18} className={`dropdown-arrow ${openPm ? 'open' : ''}`} />
                    </div>
                    {openPm && (
                      <div className="multi-select-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                          {leaders.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #eae8e2', paddingBottom: '8px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#8a7d75', padding: '0 4px', letterSpacing: '0.5px' }}>[팀장]</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                                {leaders.map(tm => (
                                  <label key={`pm-${tm.id}`} className="checkbox-label dropdown-item">
                                    <input type="radio" name="projectPm" checked={formData.pm === tm.name} onChange={() => { setFormData({...formData, pm: tm.name}); setOpenPm(false); }} style={{ marginRight: '6px' }} />
                                    {tm.name}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', alignItems: 'start' }}>
                            {renderMemberGrid(uxMembers,    '[UX셀]',  'radio', tm => formData.pm === tm.name, (tm) => { setFormData({...formData, pm: tm.name}); setOpenPm(false); }, 'pm')}
                            {renderMemberGrid(videoMembers, '[영상셀]', 'radio', tm => formData.pm === tm.name, (tm) => { setFormData({...formData, pm: tm.name}); setOpenPm(false); }, 'pm')}
                            {renderMemberGrid(editMembers,  '[편집셀]', 'radio', tm => formData.pm === tm.name, (tm) => { setFormData({...formData, pm: tm.name}); setOpenPm(false); }, 'pm')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 담당자 선택 */}
                <div className="form-group assignee-select-field">
                  <label>담당자 선택</label>
                  <div className="multi-select-dropdown" ref={assigneeDropdownRef}>
                    <div className={`multi-select-header ${openAssignees ? 'active' : ''}`} onClick={() => setOpenAssignees(v => !v)}>
                      <div className="selected-names">{formData.assignees?.length ? formData.assignees.join(', ') : '담당자를 선택하세요...'}</div>
                      <ChevronDown size={18} className={`dropdown-arrow ${openAssignees ? 'open' : ''}`} />
                    </div>
                    {openAssignees && (
                      <div className="multi-select-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                          {leaders.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #eae8e2', paddingBottom: '8px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#8a7d75', padding: '0 4px', letterSpacing: '0.5px' }}>[팀장]</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                                {leaders.map(tm => (
                                  <label key={tm.id} className="checkbox-label dropdown-item">
                                    <input type="checkbox" checked={formData.assignees?.includes(tm.name) || false}
                                      onChange={e => {
                                        const next = e.target.checked ? [...(formData.assignees || []), tm.name] : (formData.assignees || []).filter(n => n !== tm.name);
                                        setFormData({...formData, assignees: next});
                                      }} />
                                    {tm.name}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', alignItems: 'start' }}>
                            {[['[UX셀]', uxMembers], ['[영상셀]', videoMembers], ['[편집셀]', editMembers]].map(([label, members]) =>
                              renderMemberGrid(
                                members as TeamMember[], label as string, 'checkbox',
                                tm => formData.assignees?.includes(tm.name) || false,
                                (tm, chk) => {
                                  const next = chk ? [...(formData.assignees || []), tm.name] : (formData.assignees || []).filter(n => n !== tm.name);
                                  setFormData({...formData, assignees: next});
                                },
                                'asgn'
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="tag-list" style={{ marginTop: '8px' }}>
                    {formData.assignees?.map((name, i) => (
                      <div key={i} className="tag">
                        {name}
                        <button type="button" onClick={() => setFormData({...formData, assignees: (formData.assignees || []).filter(n => n !== name)})}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 이슈 사항 */}
          <div className="form-section-group issue-section">
            <div className="form-group col-span-2">
              <div className="issue-header-row">
                <label>이슈 사항</label>
                {!isAddingIssue && (
                  <button type="button" onClick={() => setIsAddingIssue(true)} className="add-issue-toggle-btn">+ 이슈 추가</button>
                )}
              </div>
              {isAddingIssue && (
                <div className="issue-input-box">
                  <div className="issue-input-fields">
                    <input
                      type="text" placeholder="이슈 제목을 입력하세요..." value={issueInput}
                      onChange={e => setIssueInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddIssue(); } }}
                      autoFocus
                    />
                    <RichTextEditor value={issueDetailInput} onChange={setIssueDetailInput} placeholder="상세 내용을 입력하세요 (선택 사항)..." onCtrlEnter={onAddIssue} />
                  </div>
                  <div className="issue-input-actions">
                    <button type="button" onClick={() => { setIsAddingIssue(false); setIssueInput(''); setIssueDetailInput(''); }} className="cancel-issue-btn">취소</button>
                    <button type="button" onClick={onAddIssue} className="save-issue-btn" disabled={!issueInput.trim()}>추가하기</button>
                  </div>
                </div>
              )}
              <div className="tag-list issue-tag-list">
                {formData.issues?.map((a, i) => {
                  const text = typeof a === 'string' ? a : a.text;
                  const isPinned = typeof a === 'object' && a.isPinned;
                  return (
                    <div key={i} className={`tag issue-tag ${isPinned ? 'pinned' : ''}`}>
                      {editingIssueIndex === i ? (
                        <div className="issue-input-box" style={{ width: '100%', margin: '8px 0', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                          <div className="issue-input-fields">
                            <input type="text" value={editingIssueText} onChange={e => setEditingIssueText(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onUpdateIssue(); } }}
                              autoFocus placeholder="이슈 제목을 입력하세요..."
                            />
                            <RichTextEditor value={editingIssueDetail} onChange={setEditingIssueDetail} placeholder="상세 내용을 입력하세요 (선택 사항)..." onCtrlEnter={onUpdateIssue} />
                          </div>
                          <div className="issue-input-actions">
                            <button type="button" onClick={() => setEditingIssueIndex(null)} className="cancel-issue-btn">취소</button>
                            <button type="button" onClick={onUpdateIssue} className="save-issue-btn" disabled={!editingIssueText.trim()}>저장하기</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="issue-content-row">
                            <span className="issue-text">{text}</span>
                            {typeof a === 'object' && a.detail && (
                              <span className="issue-detail-sub" dangerouslySetInnerHTML={{ __html: a.detail }} />
                            )}
                          </div>
                          <div className="issue-actions">
                            <button type="button" className={`pin-btn-small ${isPinned ? 'active' : ''}`} onClick={() => onPinIssue(i)} title="대시보드 고정">
                              <Pin size={12} fill={isPinned ? 'currentColor' : 'none'} />
                            </button>
                            <button type="button" className="edit-btn-small" onClick={() => onStartEditIssue(i, text, typeof a === 'object' ? a.detail : '')} title="수정">
                              <Edit2 size={12} />
                            </button>
                            <button type="button" className="del-btn-small" onClick={() => onRemoveIssue(i)} title="삭제">
                              <X size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 관련 링크 */}
          <div className="form-section-group links-section">
            <div className="form-group col-span-2">
              <div className="issue-header-row">
                <label>관련 링크</label>
                <button type="button" className="add-link-btn" onClick={() => setFormData({...formData, relatedLinks: [...(formData.relatedLinks || []), { title: '', url: '' }]})}>+ 링크 추가</button>
              </div>
              <div className="links-input-list">
                {(formData.relatedLinks || []).map((link, idx) => {
                  const isObj = typeof link === 'object' && link !== null;
                  const url   = isObj ? (link as any).url   : (link as string);
                  const title = isObj ? (link as any).title : '';
                  return (
                    <div key={idx} className="link-input-row">
                      <input type="text" placeholder="링크 제목 (예: 피그마, 출처)" value={title}
                        onChange={e => {
                          const nl = [...(formData.relatedLinks || [])];
                          nl[idx] = isObj ? { ...(nl[idx] as any), title: e.target.value } : { title: e.target.value, url: link };
                          setFormData({...formData, relatedLinks: nl});
                        }} className="link-title-input" />
                      <input type="text" placeholder="https://..." value={url}
                        onChange={e => {
                          const nl = [...(formData.relatedLinks || [])];
                          nl[idx] = isObj ? { ...(nl[idx] as any), url: e.target.value } : { title: `링크 ${idx + 1}`, url: e.target.value };
                          setFormData({...formData, relatedLinks: nl});
                        }} className="link-url-input" />
                      <button type="button" className="link-delete-btn" onClick={() => {
                        const nl = [...(formData.relatedLinks || [])];
                        nl.splice(idx, 1);
                        setFormData({...formData, relatedLinks: nl});
                      }}><Trash2 size={14} /></button>
                    </div>
                  );
                })}
              </div>
              {(!formData.relatedLinks || formData.relatedLinks.length === 0) && (
                <div className="no-links-text">등록된 관련 링크가 없습니다. 우측 추가 버튼을 눌러 링크를 등록하세요.</div>
              )}
            </div>
          </div>

          <hr className="form-divider" />

          {/* 미리보기 썸네일 */}
          <div className="form-group thumbnail-select-section">
            <label>미리보기 이미지 지정 (선택 시 지정)</label>
            <div className="thumbnail-grid">
              {(() => {
                const allImages = [
                  ...(formData.versions?.flatMap(v => v.drafts) || []),
                  ...(formData.tasks?.flatMap(t => t.attachments) || []),
                ].filter(url => url && isImageAttachmentUrl(url));
                const unique = Array.from(new Set(allImages));
                if (unique.length === 0) return <div className="no-images-text">등록된 이미지가 없습니다.</div>;
                return unique.map((url, i) => (
                  <div key={i} className={`thumbnail-item ${formData.thumbnail === url ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, thumbnail: formData.thumbnail === url ? '' : url})}>
                    <img src={url} alt="thumbnail-option" />
                    {formData.thumbnail === url && <div className="selected-badge"><Check size={12} /></div>}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* ── 푸터 ── */}
        <div className="edit-modal-footer">
          <button className="cancel-btn" onClick={onClose}>취소</button>
          <button className="save-btn" onClick={onSave}>
            {mode === 'edit' ? '업무 정보 수정' : '프로젝트 생성하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
