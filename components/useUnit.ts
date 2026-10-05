"use client";

import { useEffect, useState } from "react";
import type { Unit } from "@/lib/units";

const KEY = "veltro:unit";

/** cm/in preference, remembered per browser when storage is available. */
export function useUnit(): [Unit, (u: Unit) => void] {
  const [unit, setUnit] = useState<Unit>("cm");
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "in") setUnit("in");
    } catch {}
  }, []);
  return [
    unit,
    (u: Unit) => {
      setUnit(u);
      try {
        localStorage.setItem(KEY, u);
      } catch {}
    },
  ];
}
