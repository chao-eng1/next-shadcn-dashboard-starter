// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useEffect, useRef, useState, RefObject } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Size, UseResizableOptions } from '@/types/chat';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useResizable = (options: UseResizableOptions) => {
  const {
    nodeRef,
    disabled = false,
    minSize = { width: 280, height: 350 },
    maxSize = { width: 600, height: 500 },
    onResize,
    initialSize = { width: 320, height: 450 }
  } = options;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isResizing, setIsResizing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [size, setSize] = useState<Size>(initialSize);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resizeStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sizeStart = useRef<Size>({ width: 0, height: 0 });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const constrainSize = (newSize: Size): Size => {
    return {
      width: Math.max(minSize.width, Math.min(newSize.width, maxSize.width)),
      height: Math.max(minSize.height, Math.min(newSize.height, maxSize.height))
    };
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (disabled || !nodeRef.current) return;

    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const rect = nodeRef.current.getBoundingClientRect();
    resizeStart.current = { x: e.clientX, y: e.clientY };
    sizeStart.current = { width: rect.width, height: rect.height };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const deltaX = e.clientX - resizeStart.current.x;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const deltaY = e.clientY - resizeStart.current.y;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const newSize = constrainSize({
      width: sizeStart.current.width + deltaX,
      height: sizeStart.current.height + deltaY
    });

    setSize(newSize);
    onResize?.(newSize);
  };

  const handleMouseUp = () => {
    if (!isResizing) return;

    setIsResizing(false);
  };

  useEffect(() => {
    if (!nodeRef.current) return;

    // 创建调整大小手柄
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const resizeHandle = document.createElement('div');
    resizeHandle.className =
      'absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100';
    resizeHandle.innerHTML =
      '<div class="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400"></div>';

    nodeRef.current.appendChild(resizeHandle);
    resizeHandle.addEventListener('mousedown', handleMouseDown);

    return () => {
      resizeHandle.removeEventListener('mousedown', handleMouseDown);
      if (nodeRef.current?.contains(resizeHandle)) {
        nodeRef.current.removeChild(resizeHandle);
      }
    };
  }, [disabled, nodeRef]);

  useEffect(() => {
    if (!isResizing) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, size]);

  return {
    isResizing,
    size,
    setSize
  };
};
