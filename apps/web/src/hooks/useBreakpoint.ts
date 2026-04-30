"use client";

import { useEffect, useState } from "react";

export function useBreakpoint() {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsTablet(event.matches);
    };

    setIsTablet(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return { isTablet };
}
