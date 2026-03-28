import { useState, useCallback } from "react";

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
}

const STORAGE_KEY = "probuilder_company_settings";

const DEFAULTS: CompanySettings = {
  name: "ProBuilder",
  email: "info@probuilder.com",
  phone: "(555) 123-4567",
  address: "123 Construction Way",
  city: "Building City",
  state: "ST",
  zip: "12345",
  license: "GC-2024-001234",
  website: "www.probuilder.com",
};

export function loadCompanySettings(): CompanySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function saveCompanySettings(settings: CompanySettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings>(loadCompanySettings);

  const save = useCallback((updated: CompanySettings) => {
    saveCompanySettings(updated);
    setSettings(updated);
  }, []);

  return { settings, save };
}
