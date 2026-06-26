import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, Frame, MousePointer2, Maximize2, Minimize2, Check, Move } from 'lucide-react';

interface ZoomableImageProps {
  src: string;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, isFullScreen, toggleFullScreen }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 컨테이너에 이미지가 꽉 차도록 스케일 계산 (여백 5%)
  const resetToFit = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container || !img.naturalWidth) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0) return;
    const fitScale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight, 1) * 0.95;
    setScale(fitScale);
    setPosition({
      x: (rect.width - img.naturalWidth * fitScale) / 2,
      y: (rect.height - img.naturalHeight * fitScale) / 2,
    });
    setTimeout(() => setIsInitialLoad(false), 50);
  }, []);

  const resetToActualSize = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;
    const rect = container.getBoundingClientRect();
    setScale(1);
    setPosition({
      x: (rect.width - img.naturalWidth) / 2,
      y: (rect.height - img.naturalHeight) / 2,
    });
  }, []);

  // Ctrl + 휠로 줌
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const zoomSpeed = 0.0015;
      const newScale = Math.min(Math.max(0.01, scale + (-e.deltaY) * zoomSpeed * scale), 20);
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const dx = (mouseX - position.x) / scale;
      const dy = (mouseY - position.y) / scale;
      setScale(newScale);
      setPosition({ x: mouseX - dx * newScale, y: mouseY - dy * newScale });
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [scale, position]);

  // src 변경 시 초기화
  useEffect(() => {
    setIsInitialLoad(true);
    if (imgRef.current?.complete) resetToFit();
  }, [src, resetToFit]);

  // 전체화면 전환 시 리사이즈 대응
  useEffect(() => {
    const timer = setTimeout(resetToFit, 150);
    return () => clearTimeout(timer);
  }, [isFullScreen, resetToFit]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className={`zoom-container ${isFullScreen ? 'is-fullscreen' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: isDragging ? 'grabbing' : 'grab',
        background: '#000',
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt="zoomable"
        onLoad={resetToFit}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          transition: isDragging || isInitialLoad ? 'none' : 'transform 0.1s ease-out',
          opacity: isInitialLoad ? 0 : 1,
          maxWidth: 'none',
          maxHeight: 'none',
          display: 'block',
        }}
        draggable={false}
      />

      {/* 우상단 줌 컨트롤 */}
      <div className="zoom-controls-top-right">
        <div className="zoom-controls-group">
          <div className="zoom-menu-wrapper">
            <button
              className="zoom-menu-trigger"
              onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
            >
              {scale === 1 ? <MousePointer2 size={14} /> : <Frame size={14} />}
              <span className="zoom-percent">{(scale * 100).toFixed(0)}%</span>
              <ChevronDown size={14} />
            </button>

            {showMenu && (
              <>
                <div className="zoom-menu-backdrop" onClick={() => setShowMenu(false)} />
                <div className="zoom-dropdown-menu">
                  <div className="menu-section">
                    <div className="menu-label">Recommended</div>
                    <button className="menu-item" onClick={() => { resetToActualSize(); setShowMenu(false); }}>
                      <div className="menu-item-icon">1:1</div>
                      <span className="menu-item-text">Actual size (100%)</span>
                      {Math.abs(scale - 1) < 0.01 && <Check size={14} className="menu-check" />}
                    </button>
                    <button className="menu-item" onClick={() => { resetToFit(); setShowMenu(false); }}>
                      <Frame size={14} />
                      <span className="menu-item-text">Fit to screen</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            className={`zoom-fs-btn ${isFullScreen ? 'active' : ''}`}
            onClick={e => { e.stopPropagation(); toggleFullScreen(); }}
            title={isFullScreen ? 'Exit full screen' : 'Fill screen'}
          >
            {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="zoom-indicator-minimal">
        <Move size={12} />
        <span>Drag to pan / Ctrl + Wheel to zoom</span>
      </div>
    </div>
  );
};

export default ZoomableImage;
