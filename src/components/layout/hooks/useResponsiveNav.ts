import { useState, useEffect, useRef, useCallback } from 'react';

interface NavItem {
  path: string;
  label: string;
}

interface UseResponsiveNavReturn {
  visibleItems: NavItem[];
  hiddenItems: NavItem[];
  containerRef: React.RefObject<HTMLDivElement>;
  moreButtonRef: React.RefObject<HTMLButtonElement>;
  setItemRef: (path: string, element: HTMLButtonElement | null) => void;
}

/**
 * GitHub-style responsive navigation hook
 * Automatically moves items to "More" menu when space is limited
 */
export function useResponsiveNav(
  items: NavItem[]
): UseResponsiveNavReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [visibleItems, setVisibleItems] = useState<NavItem[]>(items);
  const [hiddenItems, setHiddenItems] = useState<NavItem[]>([]);

  const setItemRef = useCallback((path: string, element: HTMLButtonElement | null) => {
    if (element) {
      itemRefs.current.set(path, element);
    } else {
      itemRefs.current.delete(path);
    }
  }, []);

  const calculateLayout = useCallback(() => {
    if (!containerRef.current) {
      setVisibleItems(items);
      setHiddenItems([]);
      return;
    }

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    
    // Get More button width (estimate if not yet rendered)
    const moreButtonWidth = moreButtonRef.current?.offsetWidth || 70;
    
    // Available width for navigation items (with some padding)
    const gap = 4; // gap-1 = 4px
    const padding = 20;
    const availableWidth = containerWidth - moreButtonWidth - padding;

    let totalWidth = 0;
    const newVisibleItems: NavItem[] = [];
    const newHiddenItems: NavItem[] = [];

    // Try to fit as many items as possible
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemElement = itemRefs.current.get(item.path);
      
      if (itemElement) {
        // Measure actual rendered width
        const itemRect = itemElement.getBoundingClientRect();
        const itemWidth = itemRect.width;
        const wouldFit = totalWidth + itemWidth + (newVisibleItems.length > 0 ? gap : 0) <= availableWidth;
        
        if (wouldFit) {
          newVisibleItems.push(item);
          totalWidth += itemWidth + (newVisibleItems.length > 1 ? gap : 0);
        } else {
          // This item and all remaining items go to "More"
          newHiddenItems.push(...items.slice(i));
          break;
        }
      } else {
        // If element not yet measured, estimate width based on label length
        // Rough estimate: ~8px per character + padding
        const estimatedWidth = item.label.length * 8 + 48;
        const wouldFit = totalWidth + estimatedWidth + (newVisibleItems.length > 0 ? gap : 0) <= availableWidth;
        
        if (wouldFit) {
          newVisibleItems.push(item);
          totalWidth += estimatedWidth + (newVisibleItems.length > 1 ? gap : 0);
        } else {
          newHiddenItems.push(...items.slice(i));
          break;
        }
      }
    }

    // If all items fit, don't show More button
    if (newHiddenItems.length === 0) {
      setVisibleItems(items);
      setHiddenItems([]);
    } else {
      setVisibleItems(newVisibleItems);
      setHiddenItems(newHiddenItems);
    }
  }, [items]);

  useEffect(() => {
    // Initial calculation
    const timeoutId = setTimeout(calculateLayout, 100);

    const resizeObserver = new ResizeObserver(() => {
      // Debounce calculations
      clearTimeout(timeoutId);
      setTimeout(calculateLayout, 50);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also observe window resize
    const handleResize = () => {
      clearTimeout(timeoutId);
      setTimeout(calculateLayout, 50);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateLayout]);

  // Recalculate when items change or refs update
  useEffect(() => {
    const timeoutId = setTimeout(calculateLayout, 100);
    return () => clearTimeout(timeoutId);
  }, [items, calculateLayout, itemRefs.current.size]);

  return {
    visibleItems,
    hiddenItems,
    containerRef,
    moreButtonRef,
    setItemRef,
  };
}
