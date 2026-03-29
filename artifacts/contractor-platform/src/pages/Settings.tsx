import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Save, RotateCcw, SlidersHorizontal, Percent,
  Loader2, User, Mail, AtSign, Lock, CheckCircle2,
  Upload, ImageIcon, Trash2,
} from "lucide-react";

const TAX_PRESETS = [0, 6, 6.5, 7, 7.5, 8, 8.25, 8.5, 9, 9.5, 10];
const MARKUP_PRESETS = [0, 5, 10, 15, 20, 25, 30];

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/+$/, "") || "";

/* ── PROFILE TAB ─────────────────────────────────────────────── */
function ProfileTab() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [saving, setSaving] = useState(false);

  // Sync when user data loads
  useEffect(() => {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
  }, [user?.firstName, user?.lastName]);

  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`
    : firstName
      ? firstName.slice(0, 2)
      : user?.username?.slice(0, 2).toUpperCase() ?? "U";

  const originalFirst = user?.firstName ?? "";
  const originalLast = user?.lastName ?? "";
  const isDirty = firstName !== originalFirst || lastName !== originalLast;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Profile updated", description: "Your name has been saved." });
    } catch {
      toast({ title: "Failed to save profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">

      {/* Avatar Card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-primary/20 border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary">{initials}</span>
            )}
          </div>
          <div>
            <p className="text-lg font-display font-semibold text-foreground">
              {firstName || user?.username || "Your Name"}
              {lastName ? ` ${lastName}` : ""}
            </p>
            {user?.username && (
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            )}
            {user?.email && (
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs text-green-500 font-medium">Verified account</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editable Name */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Display Name</h2>
            <p className="text-xs text-muted-foreground">
              How your name appears inside ProBuilder documents and the header
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">First Name</label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Last Name</label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Smith"
              className="bg-background border-border"
            />
          </div>
        </div>
      </div>

      {/* Read-only Account Info */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Account Details</h2>
            <p className="text-xs text-muted-foreground">
              Managed by your login provider — cannot be changed here
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {user?.username && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <AtSign className="w-3.5 h-3.5" /> Username
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm text-muted-foreground">
                <span className="truncate">@{user.username}</span>
                <Lock className="w-3.5 h-3.5 ml-auto flex-shrink-0 opacity-40" />
              </div>
            </div>
          )}

          {user?.email && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm text-muted-foreground">
                <span className="truncate">{user.email}</span>
                <Lock className="w-3.5 h-3.5 ml-auto flex-shrink-0 opacity-40" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3">
        {isDirty && !saving && (
          <Button
            type="button"
            variant="outline"
            onClick={() => { setFirstName(originalFirst); setLastName(originalLast); }}
            className="border-border"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Discard
          </Button>
        )}
        <Button
          type="submit"
          disabled={!isDirty || saving}
          className="bg-primary text-primary-foreground min-w-[130px]"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            : <><Save className="w-4 h-4 mr-2" /> Save Profile</>
          }
        </Button>
      </div>
    </form>
  );
}

/* ── MAIN SETTINGS PAGE ──────────────────────────────────────── */
export default function Settings() {
  const { settings, save, isLoading, isSaving } = useCompanySettings();
  const { toast } = useToast();

  const [form, setForm] = useState({ ...settings });
  const [initialized, setInitialized] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userEditedRef = useRef(false);

  // Initialize form from server data (once)
  useEffect(() => {
    if (!isLoading && !initialized) {
      setForm({ ...settings });
      setInitialized(true);
    }
  }, [isLoading, initialized, settings]);

  // Auto-save whenever form changes, after user has made at least one edit
  useEffect(() => {
    if (!initialized || !userEditedRef.current) return;
    if (!form.name.trim()) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setAutoSaved(false);
    saveTimer.current = setTimeout(async () => {
      try {
        await save(form);
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 3000);
      } catch {
        // Silent fail — user can still use the manual Save button
      }
    }, 1200);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, initialized]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);
  const set = (field: string, value: string | number) => {
    userEditedRef.current = true;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Company name is required", variant: "destructive" });
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try {
      await save(form);
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 3000);
      toast({ title: "Settings saved", description: "Changes will appear on all new PDFs." });
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5 MB", variant: "destructive" });
      return;
    }
    // Cancel any pending auto-save to avoid race condition
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setLogoUploading(true);
    try {
      const metaRes = await fetch(`${BASE_URL}/api/storage/uploads/request-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!metaRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await metaRes.json();

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      // Save using current form state (not stale server state) so unsaved edits are preserved
      const latestForm = { ...form, logoUrl: objectPath };
      setForm(latestForm);
      await save(latestForm);
      toast({ title: "Logo uploaded", description: "Your logo will appear on all new PDFs." });
    } catch (err) {
      toast({ title: "Logo upload failed", description: String(err), variant: "destructive" });
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try {
      const latestForm = { ...form, logoUrl: "" };
      setForm(latestForm);
      await save(latestForm);
      toast({ title: "Logo removed" });
    } catch {
      toast({ title: "Failed to remove logo", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">

        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal profile, company info, and estimate defaults.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">

          <TabsList className="bg-secondary">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="w-4 h-4" /> Company
            </TabsTrigger>
            <TabsTrigger value="options" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Options
            </TabsTrigger>
          </TabsList>

          {/* ── PROFILE TAB ──────────────────────────────────── */}
          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>

          {/* ── COMPANY + OPTIONS — share the same form ───────── */}
          <form onSubmit={handleSave}>

            {/* ── COMPANY TAB ─────────────────────────────────── */}
            <TabsContent value="company" className="space-y-6">

              {/* Logo Upload */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border mb-5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Company Logo</h2>
                    <p className="text-xs text-muted-foreground">Appears in the header of every PDF — PNG or JPG, max 5 MB</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  {/* Preview */}
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {form.logoUrl ? (
                      <img
                        src={`${BASE_URL}/api/storage${form.logoUrl}`}
                        alt="Company logo"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <ImageIcon className="w-8 h-8 opacity-30" />
                        <span className="text-xs opacity-50">No logo</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 border-border"
                      disabled={logoUploading}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {logoUploading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                        : <><Upload className="w-4 h-4" /> {form.logoUrl ? "Replace Logo" : "Upload Logo"}</>
                      }
                    </Button>
                    {form.logoUrl && !logoUploading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={handleRemoveLogo}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

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

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  {isSaving && (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                    </span>
                  )}
                  {!isSaving && autoSaved && (
                    <span className="flex items-center gap-1.5 text-green-500">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All changes saved
                    </span>
                  )}
                  {!isSaving && !autoSaved && isDirty && (
                    <span className="text-yellow-500/80">Unsaved changes</span>
                  )}
                </div>
                <div className="flex gap-3">
                  {isDirty && !isSaving && (
                    <Button type="button" variant="outline" onClick={() => { userEditedRef.current = false; setForm({ ...settings }); }} className="border-border">
                      <RotateCcw className="w-4 h-4 mr-2" /> Discard
                    </Button>
                  )}
                  <Button type="submit" disabled={!isDirty || isSaving} className="bg-primary text-primary-foreground min-w-[130px]">
                    {isSaving
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                      : <><Save className="w-4 h-4 mr-2" /> Save Now</>
                    }
                  </Button>
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

              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs text-muted-foreground">
                  These defaults are applied when you create a new estimate. They do not retroactively change existing estimates.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  {isSaving && (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                    </span>
                  )}
                  {!isSaving && autoSaved && (
                    <span className="flex items-center gap-1.5 text-green-500">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All changes saved
                    </span>
                  )}
                  {!isSaving && !autoSaved && isDirty && (
                    <span className="text-yellow-500/80">Unsaved changes</span>
                  )}
                </div>
                <div className="flex gap-3">
                  {isDirty && !isSaving && (
                    <Button type="button" variant="outline" onClick={() => { userEditedRef.current = false; setForm({ ...settings }); }} className="border-border">
                      <RotateCcw className="w-4 h-4 mr-2" /> Discard
                    </Button>
                  )}
                  <Button type="submit" disabled={!isDirty || isSaving} className="bg-primary text-primary-foreground min-w-[130px]">
                    {isSaving
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                      : <><Save className="w-4 h-4 mr-2" /> Save Now</>
                    }
                  </Button>
                </div>
              </div>
            </TabsContent>

          </form>
        </Tabs>
      </div>
    </AppLayout>
  );
}
