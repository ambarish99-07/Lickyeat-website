"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "lky_theme";

function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
}

/**
 * Light / dark toggle. Initial value comes from the pre-paint inline script in
 * the layout (data-theme on <html>) or the OS preference; the toggle then wins.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = document.documentElement.dataset.theme as Theme | undefined;
    setTheme(stored ?? systemTheme());
    if (!stored) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => {
        if (!window.localStorage.getItem(KEY)) setTheme(mq.matches ? "dark" : "light");
      };
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
  }, []);

  function toggle() {
    setTheme((cur) => {
      const next: Theme = cur === "dark" ? "light" : "dark";
      apply(next);
      return next;
    });
  }

  return { theme, toggle };
}
