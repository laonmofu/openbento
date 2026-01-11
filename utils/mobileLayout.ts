// Mobile layout utilities for responsive grid conversion
import { BlockData } from '../types';

/**
 * Calculates the mobile grid layout for a block based on its desktop dimensions.
 *
 * Rules (Updated for 1-column mobile layout):
 * - All blocks take full width (1 column spans 1 track)
 * - Row spans are preserved or adjusted for visibility
 */
export const getMobileLayout = (block: BlockData): { colSpan: number; rowSpan: number } => {
  // Always full width on single column mobile layout
  const mobileColSpan = 1;

  // Preserve row span logic or adjust if needed
  // (Previously specific logic for medium blocks is less relevant if everything is full width,
  // but we can keep basic row preservation)
  const mobileRowSpan = block.rowSpan;

  return {
    colSpan: mobileColSpan,
    rowSpan: mobileRowSpan,
  };
};

/**
 * Mobile grid configuration constants
 */
export const MOBILE_GRID_CONFIG = {
  columns: 1, // Single column layout
  rowHeight: 80, // px per row
  gap: 12, // px between items
} as const;
