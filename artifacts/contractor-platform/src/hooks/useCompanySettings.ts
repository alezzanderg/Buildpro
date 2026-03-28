import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  license: string;
  website: string;
  defaultTaxRate: number;
  defaultMarkup: number;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;
const LS_KEY = "probuilder_company_settings";

function apiToLocal(api: Record<string, unknown>): CompanySettings {
  return {
    name:           (api.companyName    as string) ?? "",
    email:          (api.companyEmail   as string) ?? "",
    phone:          (api.companyPhone   as string) ?? "",
    address:        (api.companyAddress as string) ?? "",
    city:           (api.companyCity    as string) ?? "",
    state:          (api.companyState   as string) ?? "",
    zip:            (api.companyZip     as string) ?? "",
    license:        (api.companyLicense as string) ?? "",
    website:        (api.companyWebsite as string) ?? "",
    defaultTaxRate: Number(api.defaultTaxRate ?? 0),
    defaultMarkup:  Number(api.defaultMarkup  ?? 0),
  };
}

function localToApi(s: CompanySettings) {
  return {
    companyName:    s.name,
    companyEmail:   s.email,
    companyPhone:   s.phone,
    companyAddress: s.address,
    companyCity:    s.city,
    companyState:   s.state,
    companyZip:     s.zip,
    companyLicense: s.license,
    companyWebsite: s.website,
    defaultTaxRate: s.defaultTaxRate,
    defaultMarkup:  s.defaultMarkup,
  };
}

// ── Module-level cache (synchronous, used by PDF generation) ──────────
let settingsCache: CompanySettings = {
  name: "ProBuilder", email: "", phone: "",
  address: "", city: "", state: "", zip: "",
  license: "", website: "",
  defaultTaxRate: 0, defaultMarkup: 0,
};

// Eagerly prefetch settings so PDF generation has fresh data
fetch(`${API}/settings`)
  .then(r => r.ok ? r.json() : null)
  .then(data => { if (data) settingsCache = apiToLocal(data); })
  .catch(() => {/* ignore — cache keeps defaults */});

/** Synchronous read used by PDF renderers. Always returns the latest fetched values. */
export function loadCompanySettings(): CompanySettings {
  return settingsCache;
}

// ── API helper ────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── React hook ────────────────────────────────────────────────────────
export function useCompanySettings() {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery<CompanySettings>({
    queryKey: ["settings"],
    queryFn: async () => {
      const data = await apiFetch<Record<string, unknown>>("/settings");
      const local = apiToLocal(data);
      settingsCache = local;
      return local;
    },
    staleTime: 1000 * 60,
  });

  // One-time migration: if the user had data in localStorage, push it to the DB
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const old = JSON.parse(raw) as Partial<CompanySettings>;
      // Only migrate if they actually saved something meaningful
      if (!old.name && !old.defaultTaxRate && !old.defaultMarkup) return;
      const merged: CompanySettings = {
        name:           old.name           ?? "",
        email:          old.email          ?? "",
        phone:          old.phone          ?? "",
        address:        old.address        ?? "",
        city:           old.city           ?? "",
        state:          old.state          ?? "",
        zip:            old.zip            ?? "",
        license:        old.license        ?? "",
        website:        old.website        ?? "",
        defaultTaxRate: old.defaultTaxRate ?? 0,
        defaultMarkup:  old.defaultMarkup  ?? 0,
      };
      apiFetch<Record<string, unknown>>("/settings", {
        method: "PUT",
        body: JSON.stringify(localToApi(merged)),
      }).then(data => {
        settingsCache = apiToLocal(data);
        qc.setQueryData(["settings"], settingsCache);
        localStorage.removeItem(LS_KEY);
      }).catch(() => {});
    } catch { /* skip bad data */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutation = useMutation<CompanySettings, Error, CompanySettings>({
    mutationFn: async (updated: CompanySettings) => {
      const data = await apiFetch<Record<string, unknown>>("/settings", {
        method: "PUT",
        body: JSON.stringify(localToApi(updated)),
      });
      return apiToLocal(data);
    },
    onSuccess: (data: CompanySettings) => {
      settingsCache = data;
      qc.setQueryData(["settings"], data);
    },
  });

  const effectiveSettings: CompanySettings = settings ?? settingsCache;

  return {
    settings: effectiveSettings,
    isLoading,
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
