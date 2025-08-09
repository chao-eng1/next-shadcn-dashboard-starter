import { useEffect, useRef, useState, useCallback } from 'react';
import { Position } from '@/types/chat';

interface UseFloatingDragOptions {
  initialPosition: Position;
  onPositionChange?: (position: Position) => void;
  snapToEdge?: boolean;
  snapThreshold?: number;
  disabled?: boolean;
}

interface DragState {
  isDragging: boolean;
  isMouseDown: boolean;
  isSnappedToEdge: boolean;
  snappedSide: 'left' | 'right' | null;
  position: Position;
  dragOffset: Position;
  startPosition: Position;
  hasDragged: boolean;
}

export const useFloatingDrag = ({
  initialPosition,
  onPositionChange,
  snapToEdge = true,
  snapThreshold = 50,
  disabled = false
}: UseFloatingDragOptions) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isMouseDown: false,
    isSnappedToEdge: false,
    snappedSide: null,
    position: initialPosition,
    dragOffset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
    hasDragged: false
  });

  const dragRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // 获取屏幕边界
  const getBounds = useCallback(() => {
    return {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight
    };
  }, []);

  // 计算贴边位置
  const calculateSnapPosition = useCallback(
    (pos: Position, elementSize: { width: number; height: number }) => {
      const bounds = getBounds();
      const { width, height } = elementSize;

      let snappedPos = { ...pos };
      let isSnapped = false;
      let snappedSide: 'left' | 'right' | null = null;

      // 检查是否需要贴边
      if (pos.x < snapThreshold) {
        snappedPos.x = 0;
        isSnapped = true;
        snappedSide = 'left';
      } else if (pos.x > bounds.right - width - snapThreshold) {
        snappedPos.x = bounds.right - width;
        isSnapped = true;
        snappedSide = 'right';
      }

      // 限制垂直边界
      snappedPos.y = Math.max(0, Math.min(pos.y, bounds.bottom - height));

      return { position: snappedPos, isSnapped, snappedSide };
    },
    [snapThreshold, getBounds]
  );

  // 开始拖拽
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || !dragRef.current) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = dragRef.current.getBoundingClientRect();
      const offset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      setDragState((prev) => ({
        ...prev,
        isMouseDown: true,
        isDragging: false,
        hasDragged: false,
        dragOffset: offset,
        startPosition: { x: e.clientX, y: e.clientY },
        isSnappedToEdge: false,
        snappedSide: null
      }));
    },
    [disabled]
  );

  // 拖拽中
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isMouseDown || !dragRef.current) return;

      // 计算鼠标移动距离
      const deltaX = e.clientX - dragState.startPosition.x;
      const deltaY = e.clientY - dragState.startPosition.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // 只有移动距离超过阈值才开始拖拽
      if (!dragState.isDragging && distance > 5) {
        setDragState((prev) => ({
          ...prev,
          isDragging: true,
          hasDragged: true
        }));
      }

      // 如果已经开始拖拽，更新位置
      if (dragState.isDragging) {
        const newPosition = {
          x: e.clientX - dragState.dragOffset.x,
          y: e.clientY - dragState.dragOffset.y
        };

        const rect = dragRef.current.getBoundingClientRect();
        const elementSize = { width: rect.width, height: rect.height };

        // 限制在屏幕范围内
        const bounds = getBounds();
        const constrainedPosition = {
          x: Math.max(
            0,
            Math.min(newPosition.x, bounds.right - elementSize.width)
          ),
          y: Math.max(
            0,
            Math.min(newPosition.y, bounds.bottom - elementSize.height)
          )
        };

        setDragState((prev) => ({
          ...prev,
          position: constrainedPosition
        }));
      }
    },
    [
      dragState.isMouseDown,
      dragState.isDragging,
      dragState.startPosition,
      dragState.dragOffset,
      getBounds
    ]
  );

  // 结束拖拽
  const handleMouseUp = useCallback(() => {
    if (!dragState.isMouseDown) return;

    let finalPosition = dragState.position;
    let isSnapped = false;
    let snappedSide: 'left' | 'right' | null = null;

    // 如果发生了拖拽，处理贴边逻辑
    if (dragState.isDragging && dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      const elementSize = { width: rect.width, height: rect.height };

      if (snapToEdge) {
        const snapResult = calculateSnapPosition(
          dragState.position,
          elementSize
        );
        finalPosition = snapResult.position;
        isSnapped = snapResult.isSnapped;
        snappedSide = snapResult.snappedSide;
      }
      onPositionChange?.(finalPosition);
    }

    setDragState((prev) => ({
      ...prev,
      isDragging: false,
      isMouseDown: false,
      position: finalPosition,
      isSnappedToEdge: isSnapped,
      snappedSide: snappedSide
    }));
  }, [
    dragState.isMouseDown,
    dragState.isDragging,
    dragState.position,
    snapToEdge,
    calculateSnapPosition,
    onPositionChange
  ]);

  // 绑定全局事件
  useEffect(() => {
    if (dragState.isMouseDown) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      if (dragState.isDragging) {
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [
    dragState.isMouseDown,
    dragState.isDragging,
    handleMouseMove,
    handleMouseUp
  ]);

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (!dragRef.current) return;

      const rect = dragRef.current.getBoundingClientRect();
      const elementSize = { width: rect.width, height: rect.height };
      const bounds = getBounds();

      // 确保元素仍在屏幕范围内
      const constrainedPosition = {
        x: Math.max(
          0,
          Math.min(dragState.position.x, bounds.right - elementSize.width)
        ),
        y: Math.max(
          0,
          Math.min(dragState.position.y, bounds.bottom - elementSize.height)
        )
      };

      if (
        constrainedPosition.x !== dragState.position.x ||
        constrainedPosition.y !== dragState.position.y
      ) {
        setDragState((prev) => ({
          ...prev,
          position: constrainedPosition
        }));
        onPositionChange?.(constrainedPosition);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dragState.position, getBounds, onPositionChange]);

  // 更新位置
  const updatePosition = useCallback((newPosition: Position) => {
    setDragState((prev) => ({
      ...prev,
      position: newPosition
    }));
  }, []);

  return {
    dragRef,
    position: dragState.position,
    isDragging: dragState.isDragging,
    isMouseDown: dragState.isMouseDown,
    hasDragged: dragState.hasDragged,
    isSnappedToEdge: dragState.isSnappedToEdge,
    snappedSide: dragState.snappedSide,
    handleMouseDown,
    updatePosition
  };
};
