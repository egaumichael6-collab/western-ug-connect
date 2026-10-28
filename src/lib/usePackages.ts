import { useEffect, useState } from "react";
import { supabase, friendlyError } from "./supabase";
import type { Package } from "./types";

/** Package prices always come from the database — the single source of truth. */
export function usePackages() {
  const [packages, setPackages] = useState<Package[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    supabase.from("membership_packages").select("*").order("sort_order").then(({ data, error }) => {
      if (error) setError(friendlyError(error));
      setPackages((data ?? []) as Package[]);
    });
  }, []);
  return { packages, error };
}
