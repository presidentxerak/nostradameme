"use client";

import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

export function useReducedMotionPreference(): boolean {
  const reduced = useFramerReducedMotion();
  return Boolean(reduced);
}
