/**
 * InputController - Gesture Layer for Swipe Input
 * Match & Bloom - Botanical Zen Edition
 *
 * Wraps the Game Board with PanGestureHandler for swipe detection.
 * Maps touch coordinates to grid indices and enforces 4-direction swipes.
 * Features:
 * - 15px drag threshold for swipe activation
 * - 4-directional constraint (Up/Down/Left/Right only)
 * - Touch to grid coordinate mapping
 */

import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import {
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { GRID_SIZE, indexToPosition, isValidIndex, positionToIndex } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_PADDING = 16;
const BOARD_SIZE = SCREEN_WIDTH - BOARD_PADDING * 2;
const CELL_SIZE = BOARD_SIZE / GRID_SIZE;

// Swipe activation threshold (15px as specified)
const SWIPE_THRESHOLD = 15;

// ============================================================================
// TYPES
// ============================================================================

interface InputControllerProps {
  children: React.ReactNode;
  onSwipe: (fromIndex: number, direction: 'up' | 'down' | 'left' | 'right') => void;
  onTap?: (touchX: number, touchY: number) => void;
}

/**
 * Swipe direction enum
 */
type SwipeDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Gesture state tracking
 */
interface GestureState {
  isActive: boolean;
  startX: number;
  startY: number;
  startIndex: number;
  hasSwiped: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const InputController: React.FC<InputControllerProps> = ({
  children,
  onSwipe,
  onTap,
}) => {
  // Track gesture state
  const [gestureState, setGestureState] = useState<GestureState>({
    isActive: false,
    startX: 0,
    startY: 0,
    startIndex: -1,
    hasSwiped: false,
  });

  // Animated shared values for gesture tracking
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  // Ref to track if we're in a swipe gesture
  const isSwipingRef = useRef(false);
  const swipeDirectionRef = useRef<SwipeDirection | null>(null);

  /**
   * Convert screen coordinates to grid index
   */
  const getGridIndexFromCoordinates = useCallback((x: number, y: number): number => {
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) {
      return -1;
    }

    return positionToIndex(row, col);
  }, []);

  /**
   * Determine swipe direction from translation
   */
  const getSwipeDirection = (dx: number, dy: number): SwipeDirection | null => {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Must exceed threshold to determine direction
    if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) {
      return null;
    }

    // Determine primary direction (horizontal or vertical)
    if (absDx > absDy) {
      // Horizontal movement
      return dx > 0 ? 'right' : 'left';
    } else {
      // Vertical movement
      return dy > 0 ? 'down' : 'up';
    }
  };

  /**
   * Calculate target index based on swipe direction
   */
  const getTargetIndex = useCallback((
    startIdx: number,
    direction: SwipeDirection
  ): number | null => {
    const { row, col } = indexToPosition(startIdx);

    let targetRow = row;
    let targetCol = col;

    switch (direction) {
      case 'up':
        targetRow = Math.max(0, row - 1);
        break;
      case 'down':
        targetRow = Math.min(GRID_SIZE - 1, row + 1);
        break;
      case 'left':
        targetCol = Math.max(0, col - 1);
        break;
      case 'right':
        targetCol = Math.min(GRID_SIZE - 1, col + 1);
        break;
    }

    // Only allow if different position
    if (targetRow !== row || targetCol !== col) {
      return positionToIndex(targetRow, targetCol);
    }

    return null;
  }, []);

  /**
   * Handle swipe completion - JS callback
   */
  const handleSwipeComplete = useCallback((
    startIndex: number,
    direction: SwipeDirection
  ) => {
    const targetIndex = getTargetIndex(startIndex, direction);

    if (targetIndex !== null && isValidIndex(targetIndex)) {
      onSwipe(startIndex, direction);
    }
  }, [onSwipe, getTargetIndex]);

  /**
   * Handle tap completion - JS callback
   */
  const handleTap = useCallback((x: number, y: number) => {
    if (onTap) {
      runOnJS(onTap)(x, y);
    }
  }, [onTap]);

  /**
   * Pan Gesture Handler
   */
  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      const startIndex = getGridIndexFromCoordinates(event.x, event.y);

      if (startIndex >= 0) {
        setGestureState({
          isActive: true,
          startX: event.x,
          startY: event.y,
          startIndex,
          hasSwiped: false,
        });

        offsetX.value = 0;
        offsetY.value = 0;
        isSwipingRef.current = false;
        swipeDirectionRef.current = null;
      }
    })
    .onUpdate((event) => {
      if (!gestureState.isActive || gestureState.startIndex < 0) {
        return;
      }

      const dx = event.x - gestureState.startX;
      const dy = event.y - gestureState.startY;

      // Check if we've exceeded threshold and haven't started swiping yet
      if (!isSwipingRef.current) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx >= SWIPE_THRESHOLD || absDy >= SWIPE_THRESHOLD) {
          const direction = getSwipeDirection(dx, dy);

          if (direction) {
            isSwipingRef.current = true;
            swipeDirectionRef.current = direction;
          }
        }
      }

      // Update animated offsets for visual feedback
      if (isSwipingRef.current) {
        offsetX.value = dx;
        offsetY.value = dy;
      }
    })
    .onEnd((event) => {
      if (gestureState.startIndex < 0) {
        setGestureState(prev => ({ ...prev, isActive: false }));
        return;
      }

      const dx = event.translationX;
      const dy = event.translationY;

      // Reset offsets
      offsetX.value = 0;
      offsetY.value = 0;

      if (isSwipingRef.current && swipeDirectionRef.current) {
        // Complete the swipe
        runOnJS(handleSwipeComplete)(gestureState.startIndex, swipeDirectionRef.current);
      } else {
        // Treat as tap if no significant movement
        runOnJS(handleTap)(event.x, event.y);
      }

      setGestureState({
        isActive: false,
        startX: 0,
        startY: 0,
        startIndex: -1,
        hasSwiped: false,
      });

      isSwipingRef.current = false;
      swipeDirectionRef.current = null;
    })
    .onFinalize(() => {
      // Reset on gesture cancellation
      offsetX.value = 0;
      offsetY.value = 0;
      setGestureState({
        isActive: false,
        startX: 0,
        startY: 0,
        startIndex: -1,
        hasSwiped: false,
      });
      isSwipingRef.current = false;
      swipeDirectionRef.current = null;
    })
    // Enable horizontal and vertical simultaneously for 4-direction swipes
    .simultaneousWithExternalGesture();

  return (
    <GestureDetector gesture={panGesture}>
      {children}
    </GestureDetector>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
  },
});

export default InputController;
