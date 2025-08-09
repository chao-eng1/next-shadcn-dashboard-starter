import { useEffect, useRef, useState, RefObject } from 'react';
import { Position, UseDraggableOptions } from '@/types/chat';

export const useDraggable = (options: UseDraggableOptions) => {
  const {
    nodeRef,
    handle,
    disabled = false,
    bounds = 'viewport',
    onDragStart,
    onDrag,
    onDragEnd,
    initialPosition = { x: 0, y: 0 }
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>(initialPosition);
  const dragStart = useRef<Position>({ x: 0, y: 0 });
  const elementStart = useRef<Position>({ x: 0, y: 0 });

  const getBounds = () => {
    if (bounds === 'viewport') {
      return {
        top: 0,
        left: 0,
        right: window.innerWidth,
        bottom: window.innerHeight
      };
    }

    if (bounds === 'parent' && nodeRef.current?.parentElement) {
      const parent = nodeRef.current.parentElement;
      const rect = parent.getBoundingClientRect();
      return {
        top: 0,
        left: 0,
        right: rect.width,
        bottom: rect.height
      };
    }

    if (typeof bounds === 'object') {
      return bounds;
    }

    return null;
  };

  const constrainPosition = (pos: Position): Position => {
    const boundsRect = getBounds();
    if (!boundsRect || !nodeRef.current) return pos;

    const element = nodeRef.current;
    const elementRect = element.getBoundingClientRect();

    return {
      x: Math.max(
        boundsRect.left,
        Math.min(pos.x, boundsRect.right - elementRect.width)
      ),
      y: Math.max(
        boundsRect.top,
        Math.min(pos.y, boundsRect.bottom - elementRect.height)
      )
    };
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (disabled || !nodeRef.current) return;

    e.preventDefault();
    setIsDragging(true);

    const rect = nodeRef.current.getBoundingClientRect();
    dragStart.current = { x: e.clientX, y: e.clientY };
    elementStart.current = { x: rect.left, y: rect.top };

    onDragStart?.(elementStart.current);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;

    const newPosition = constrainPosition({
      x: elementStart.current.x + deltaX,
      y: elementStart.current.y + deltaY
    });

    setPosition(newPosition);
    onDrag?.(newPosition);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);
    onDragEnd?.(position);
  };

  useEffect(() => {
    const handleElement = handle?.current || nodeRef.current;
    if (!handleElement) return;

    handleElement.addEventListener('mousedown', handleMouseDown);

    return () => {
      handleElement.removeEventListener('mousedown', handleMouseDown);
    };
  }, [disabled, handle, nodeRef]);

  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  return {
    isDragging,
    position,
    setPosition
  };
};
