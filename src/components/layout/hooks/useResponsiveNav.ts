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
  rightSideRef: React.RefObject<HTMLDivElement>;
  logoRef: React.RefObject<HTMLButtonElement>;
  setItemRef: (path: string, element: HTMLButtonElement | null) => void;
}

/**
 * GitHub-style responsive navigation hook
 * Automatically moves items to "More" menu when space is limited
 * Prevents header from wrapping to two lines
 */
export function useResponsiveNav(
  items: NavItem[]
): UseResponsiveNavReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const rightSideRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLButtonElement>(null);
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
    if (!containerRef.current || !rightSideRef.current || !logoRef.current) {
      setVisibleItems(items);
      setHiddenItems([]);
      return;
    }

    // Get parent container (the flex container with justify-between)
    const parentContainer = containerRef.current.parentElement;
    if (!parentContainer) {
      setVisibleItems(items);
      setHiddenItems([]);
      return;
    }

    const parentWidth = parentContainer.getBoundingClientRect().width;
    const logoWidth = logoRef.current.getBoundingClientRect().width;
    const rightSideWidth = rightSideRef.current.getBoundingClientRect().width;
    const gap = 24; // gap-6 = 24px between logo and nav
    const navGap = 4; // gap-1 = 4px between nav items
    const padding = 16; // Some safety padding
    
    // Calculate available width for navigation
    // parentWidth - logoWidth - gap - rightSideWidth - padding
    const availableWidth = parentWidth - logoWidth - gap - rightSideWidth - padding;
    
    // More button width (estimate if not rendered, or measure if rendered)
    const moreButtonWidth = moreButtonRef.current?.getBoundingClientRect().width || 70;
    
    // Available width for visible items (subtract More button width if needed)
    // We always reserve space for More button in calculation, but only show it if needed
    let widthForItems = availableWidth - moreButtonWidth - navGap;

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
        const gapNeeded = newVisibleItems.length > 0 ? navGap : 0;
        const wouldFit = totalWidth + itemWidth + gapNeeded <= widthForItems;
        
        if (wouldFit) {
          newVisibleItems.push(item);
          totalWidth += itemWidth + gapNeeded;
        } else {
          // This item and all remaining items go to "More"
          newHiddenItems.push(...items.slice(i));
          break;
        }
      } else {
        // If element not yet measured, estimate width based on label length
        // Rough estimate: ~7-9px per character + padding (40-50px)
        const estimatedWidth = Math.max(item.label.length * 7 + 40, 60);
        const gapNeeded = newVisibleItems.length > 0 ? navGap : 0;
        const wouldFit = totalWidth + estimatedWidth + gapNeeded <= widthForItems;
        
        if (wouldFit) {
          newVisibleItems.push(item);
          totalWidth += estimatedWidth + gapNeeded;
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
    // Initial calculation with delay to ensure DOM is ready
    const timeoutId = setTimeout(calculateLayout, 150);

    const resizeObserver = new ResizeObserver(() => {
      // Debounce calculations
      clearTimeout(timeoutId);
      setTimeout(calculateLayout, 100);
    });

    // Observe parent container, nav container, logo, and right side
    const parentContainer = containerRef.current?.parentElement;
    if (parentContainer) {
      resizeObserver.observe(parentContainer);
    }
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (logoRef.current) {
      resizeObserver.observe(logoRef.current);
    }
    if (rightSideRef.current) {
      resizeObserver.observe(rightSideRef.current);
    }
    if (moreButtonRef.current) {
      resizeObserver.observe(moreButtonRef.current);
    }

    // Also observe window resize
    const handleResize = () => {
      clearTimeout(timeoutId);
      setTimeout(calculateLayout, 100);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateLayout]);

  // Recalculate when items change
  useEffect(() => {
    const timeoutId = setTimeout(calculateLayout, 150);
    return () => clearTimeout(timeoutId);
  }, [items, calculateLayout]);

  return {
    visibleItems,
    hiddenItems,
    containerRef,
    moreButtonRef,
    rightSideRef,
    logoRef,
    setItemRef,
  };
}
