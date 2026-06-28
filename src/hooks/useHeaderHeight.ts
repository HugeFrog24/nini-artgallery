"use client";

import { useState, useEffect, RefObject } from "react";

/**
 * Custom hook to dynamically measure header height
 * @param headerRef - React ref to the header element
 * @returns The current height of the header in pixels
 */
function useHeaderHeight(headerRef: RefObject<HTMLElement | null>) {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        setHeaderHeight(height);
      }
    };

    // Initial measurement
    updateHeight();

    // Create ResizeObserver to watch for header size changes
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }

    // Also listen for window resize events as fallback
    window.addEventListener("resize", updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [headerRef]);

  return headerHeight;
}

/**
 * Custom hook to create and manage header height CSS variable
 * @param headerRef - React ref to the header element
 * @returns The current height of the header in pixels
 */
export function useHeaderHeightCSS(headerRef: RefObject<HTMLElement | null>) {
  const headerHeight = useHeaderHeight(headerRef);

  useEffect(() => {
    // Update CSS custom property for use in styles
    document.documentElement.style.setProperty(
      "--header-height",
      `${headerHeight}px`,
    );
  }, [headerHeight]);

  return headerHeight;
}
