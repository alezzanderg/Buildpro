import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Save, RotateCcw, SlidersHorizontal, Percent,
} from "lucide-react";

const TAX_PRESETS = [0, 6, 6.5, 7, 7.5, 8, 8.25, 8.5, 9, 9.5, 10];
const MARKUP_PRESETS = [0, 5, 10, 15, 20, 25, 30];

export default function Settings() {
  const { settings, save } = useCompanySettings();
  const { toast } = useToast();

  const [form, setForm] = useState({ ...settings });
  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Company name is required", variant: "destructive" });
      return;
    }
    save(form);
    toast({ title: "Settings saved", description: "Changes will appear on all new PDFs." });
  };

  const handleReset = () => setForm({ ...settings });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">

        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your company profile and default estimate options.
          </p>
        </div>

        <form onSubmit={handleSave}>
          <Tabs defaultValue="company" className="space-y-6">

            <TabsList className="bg-secondary">
              <TabsTrigger value="company" className="gap-2">
                <Building2 className="w-4 h-4" /> Company
              </TabsTrigger>
              <TabsTrigger value="options" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Options
              </TabsTrigger>
            </TabsList>

            {/* ── COMPANY TAB ─────────────────────────────────── */}
            <TabsContent value="company" className="space-y-6">

              {/* Company Info */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Company Information</h2>
                    <p className="text-xs text-muted-foreground">This data appears in the header of each PDF</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Company Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="My Construction Company"
                      className="bg-background border-border text-base font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="info@company.com"
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Phone</label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="(555) 000-0000"
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Website</label>
                    <Input
                      value={form.website}
                      onChange={(e) => set("website", e.target.value)}
                      placeholder="www.company.com"
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">License Number</label>
                    <Input
                      value={form.license}
                      onChange={(e) => set("license", e.target.value)}
                      placeholder="GC-2024-000000"
                      className="bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <div>
                  <h2 className="font-semibold text-foreground">Address</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Physical address of your company</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Street Address</label>
                    <Input
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="123 Main Street"
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">City</label>
                    <Input
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder="City"
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">State</label>
                      <Input
                        value={form.state}
                        onChange={(e) => set("state", e.target.value)}
                        placeholder="TX"
                        maxLength={2}
                        className="bg-background border-border uppercase"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">ZIP</label>
                      <Input
                        value={form.zip}
                        onChange={(e) => set("zip", e.target.value)}
                        placeholder="12345"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Preview */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-3">
                <h2 className="font-semibold text-foreground text-sm">PDF Header Preview</h2>
                <div className="bg-background rounded-lg p-4 border border-border/50 text-sm space-y-1">
                  <p className="font-bold text-base text-foreground">{form.name || "Company Name"}</p>
                  {form.address && (
                    <p className="text-muted-foreground text-xs">
                      {form.address}{form.city ? `, ${form.city}` : ""}{form.state ? `, ${form.state}` : ""} {form.zip}
                    </p>
                  )}
                  {form.phone && (
                    <p className="text-muted-foreground text-xs">
                      {form.phone}{form.email ? `  ·  ${form.email}` : ""}
                    </p>
                  )}
                  {form.license && (
                    <p className="text-muted-foreground text-xs">License #: {form.license}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ── OPTIONS TAB ─────────────────────────────────── */}
            <TabsContent value="options" className="space-y-6">

              {/* Tax Rate */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Percent className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Default Tax Rate</h2>
                    <p className="text-xs text-muted-foreground">
                      Applied automatically to every new estimate. You can still override it per estimate.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Tax Rate (%)</label>
                    <div className="relative w-40">
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        step={0.001}
                        value={form.defaultTaxRate}
                        onChange={(e) => set("defaultTaxRate", parseFloat(e.target.value) || 0)}
                        className="bg-background border-border pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Quick select</p>
                    <div className="flex flex-wrap gap-2">
                      {TAX_PRESETS.map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => set("defaultTaxRate", rate)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                            form.defaultTaxRate === rate
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                          }`}
                        >
                          {rate === 0 ? "None" : `${rate}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Default Markup */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Default Markup</h2>
                    <p className="text-xs text-muted-foreground">
                      Pre-filled markup percentage on every new estimate. Override it per estimate anytime.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Markup (%)</label>
                    <div className="relative w-40">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={form.defaultMarkup}
                        onChange={(e) => set("defaultMarkup", parseFloat(e.target.value) || 0)}
                        className="bg-background border-border pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Quick select</p>
                    <div className="flex flex-wrap gap-2">
                      {MARKUP_PRESETS.map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => set("defaultMarkup", pct)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                            form.defaultMarkup === pct
                              ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                          }`}
                        >
                          {pct === 0 ? "None" : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs text-muted-foreground">
                  These defaults are applied when you create a new estimate. They do not retroactively change existing estimates.
                </p>
              </div>
            </TabsContent>

          </Tabs>

          {/* Actions — always visible */}
          <div className="flex justify-end gap-3 pt-6">
            {isDirty && (
              <Button type="button" variant="outline" onClick={handleReset} className="border-border">
                <RotateCcw className="w-4 h-4 mr-2" /> Discard Changes
              </Button>
            )}
            <Button type="submit" disabled={!isDirty} className="bg-primary text-primary-foreground">
              <Save className="w-4 h-4 mr-2" /> Save Settings
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
