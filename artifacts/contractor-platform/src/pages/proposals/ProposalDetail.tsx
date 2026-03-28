import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Save, Download, Eye, EyeOff, ChevronDown,
  Send, Check, X, Loader2, Sparkles, Palette, ClipboardCopy, ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useGetProposal, useUpdateProposal } from "@/hooks/useProposals";
import { useListClients } from "@workspace/api-client-react";
import { downloadProposalPdf, ProposalPdfDocument, PDF_TEMPLATES } from "@/lib/proposalPdf";
import type { PdfTemplate } from "@/lib/proposalPdf";
import type { ProposalDetail as ProposalDetailType } from "@/hooks/useProposals";
import { PDFViewer } from "@react-pdf/renderer";

const STATUS_COLORS: Record<string, string> = {
  draft:    "bg-muted text-muted-foreground",
  sent:     "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  accepted: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-400 border border-red-500/30",
};

// ── Terms section metadata ────────────────────────────────────────────
const TERMS_META: Array<{
  key: string;
  label: string;
  helper: string;
  inBasic: boolean;
}> = [
  { key: "changeOrders",   label: "Change Orders",             helper: "Requires written approval before performing any work outside the original scope.", inBasic: true },
  { key: "siteConditions", label: "Site Conditions",           helper: "Protects against unexpected conditions discovered after work begins (mold, rot, hidden damage, etc.).", inBasic: true },
  { key: "materials",      label: "Materials & Substitutions", helper: "Covers what happens if a specified material is unavailable or backordered.", inBasic: false },
  { key: "permits",        label: "Permits, Codes & Approvals",helper: "Clarifies that permits and engineering are not included unless explicitly stated.", inBasic: true },
  { key: "access",         label: "Access & Jobsite Conditions",helper: "Sets client obligations for access, utilities, and a clear work area.", inBasic: false },
  { key: "cleanup",        label: "Cleanup & Disposal",        helper: "Defines what basic cleanup is included and what is excluded.", inBasic: true },
  { key: "warranty",       label: "Warranty / Guarantee",      helper: "States how long workmanship is covered and what is excluded.", inBasic: true },
  { key: "cancellation",   label: "Cancellation / Rescheduling",helper: "Covers deposit non-refundability and costs if the project is cancelled.", inBasic: true },
  { key: "liability",      label: "Limitation of Liability",   helper: "Limits financial exposure to the value of contracted work performed.", inBasic: false },
];

const TERMS_KEYS = TERMS_META.map(t => t.key);

const ALL_VISIBLE: Record<string, boolean> = Object.fromEntries(TERMS_KEYS.map(k => [k, true]));
const BASIC_VISIBLE: Record<string, boolean> = Object.fromEntries(TERMS_META.map(t => [t.key, t.inBasic]));

const WARRANTY_PERIODS = ["30 days", "90 days", "6 months", "1 year", "2 years"];

type FormState = {
  projectName: string; clientId: string; status: string; validUntil: string;
  introText: string; projectOverview: string; scopeOfWork: string;
  exclusions: string; allowances: string; deliverables: string;
  timeline: string; paymentTerms: string;
  changeOrders: string; siteConditions: string; materials: string;
  permits: string; access: string; cleanup: string;
  warranty: string; cancellation: string; liability: string;
  notes: string;
  warrantyPeriod: string;
};

const PROJECT_SECTIONS: (keyof FormState)[] = [
  "introText", "projectOverview", "scopeOfWork", "exclusions",
  "allowances", "deliverables", "timeline", "paymentTerms",
];

const SECTION_LABELS: Partial<Record<keyof FormState, string>> = {
  introText: "Introduction", projectOverview: "Project Overview",
  scopeOfWork: "Scope of Work", exclusions: "Exclusions",
  allowances: "Allowances & Selections", deliverables: "Deliverables",
  timeline: "Timeline", paymentTerms: "Payment Terms",
};

const SECTION_PLACEHOLDERS: Partial<Record<keyof FormState, string>> = {
  introText:       "Thank you for the opportunity to submit this proposal...",
  projectOverview: "The purpose of this project is to...",
  scopeOfWork:     "- Protect floors and adjacent finishes before starting\n- Remove existing materials scheduled for replacement\n- Install new drywall where required",
  exclusions:      "- Permits and engineering\n- Hidden damage or mold remediation\n- Owner-supplied material labor",
  allowances:      "- Tile and finish selections\n- Fixture models and finishes",
  deliverables:    "- Completion of agreed scope\n- Debris removal from work areas\n- Final walkthrough",
  timeline:        "- Preparation: 1 day\n- Demolition: 1–2 days\n- Installation: 3–5 days",
  paymentTerms:    "50% deposit due upon acceptance.\n50% due upon substantial completion.",
  notes:           "Internal notes — not shown on the PDF.",
};

// Simplified boilerplate defaults (client-side fallback for legacy proposals)
const TERMS_DEFAULTS: Partial<Record<string, string>> = {
  changeOrders:   "Any work outside the original scope requires written approval before proceeding. Change orders may affect the project price and timeline.",
  siteConditions: "This proposal is based on visible conditions at the time of the estimate. Hidden conditions discovered after work begins — including rot, mold, water damage, structural issues, or outdated systems — are not included in this price and will be communicated before any additional work is performed.",
  materials:      "Materials will be installed as specified or per approved selections. If a specified item becomes unavailable, a comparable substitute will be recommended for approval. Supply delays may affect the project schedule.",
  permits:        "Permits, engineering, inspections, and municipal approvals are excluded from this proposal unless explicitly stated. Any code-required upgrades discovered during the project may result in additional cost.",
  access:         "The client agrees to provide reasonable access to the work area during working hours and ensure utilities (water, electricity) are available as needed. The work area should be cleared of furniture, valuables, and personal items before work begins.",
  cleanup:        "Basic jobsite cleanup is included — construction debris from our work will be removed from active work areas. Deep cleaning, hazardous waste handling, and specialized disposal are excluded unless specifically listed.",
  warranty:       "Our workmanship is warranted for 1 year from the date of substantial completion against defects caused by our installation or labor under normal use conditions. This warranty does not cover owner misuse, manufacturer defects, normal wear and tear, or damage caused by third parties or conditions outside our control.",
  cancellation:   "Deposits may be non-refundable once materials have been ordered or scheduling has begun. If the project is cancelled after acceptance, the client is responsible for work completed, materials ordered, and costs incurred to date.",
  liability:      "Our liability is limited to the value of contracted work performed. We are not liable for incidental, indirect, or consequential damages, or for pre-existing conditions not caused by our work.",
};

function parseTermsConfig(raw: string | null | undefined): Record<string, boolean> {
  if (!raw) return { ...BASIC_VISIBLE };
  try { return JSON.parse(raw); }
  catch { return { ...BASIC_VISIBLE }; }
}

// ── Live PDF preview panel ────────────────────────────────────────────
function PdfPreviewPanel({
  proposal, template, onTemplateChange, onDownload, downloading,
}: {
  proposal: ProposalDetailType;
  template: PdfTemplate;
  onTemplateChange: (t: PdfTemplate) => void;
  onDownload: () => void;
  downloading: boolean;
}) {
  return (
    <div className="flex flex-col h-full border-l border-border bg-card">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">PDF Preview</span>
        </div>
        <Select value={template} onValueChange={v => onTemplateChange(v as PdfTemplate)}>
          <SelectTrigger className="h-7 text-xs w-32 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PDF_TEMPLATES.map(t => (
              <SelectItem key={t.id} value={t.id} className="text-xs">{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-hidden">
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <ProposalPdfDocument proposal={proposal} template={template} />
        </PDFViewer>
      </div>
      <div className="p-3 border-t border-border flex-shrink-0">
        <Button className="w-full gap-2" onClick={onDownload} disabled={downloading}>
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading ? "Generating..." : "Download PDF"}
        </Button>
      </div>
    </div>
  );
}

// ── Section editor ────────────────────────────────────────────────────
function SectionField({
  fieldKey, label, placeholder, value, isEnhancing, onChange,
}: {
  fieldKey: string;
  label: string;
  placeholder?: string;
  value: string;
  isEnhancing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-4 rounded bg-primary" />
        <Label className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {label}
        </Label>
        {isEnhancing && (
          <span className="flex items-center gap-1 text-xs text-primary ml-auto">
            <Sparkles className="w-3 h-3 animate-pulse" /> Enhancing…
          </span>
        )}
      </div>
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
        disabled={isEnhancing}
        className={`min-h-[100px] resize-y font-sans text-sm leading-relaxed transition-all ${
          isEnhancing
            ? "bg-primary/5 border-primary/30 text-foreground/60 cursor-wait"
            : "bg-card border-border"
        }`}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const proposalId = parseInt(id ?? "0");

  const { data: proposal, isLoading } = useGetProposal(proposalId, { enabled: !!proposalId });
  const { data: clients = [] } = useListClients();
  const updateProposal = useUpdateProposal();

  const [form, setForm] = useState<FormState | null>(null);
  const [termsVisible, setTermsVisible] = useState<Record<string, boolean>>(BASIC_VISIBLE);
  const [termsMode, setTermsMode] = useState<"basic" | "standard">("basic");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdfTemplate, setPdfTemplate] = useState<PdfTemplate>("classic");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState<Partial<Record<string, boolean>>>({});
  const [enhancingAll, setEnhancingAll] = useState(false);
  const [previewData, setPreviewData] = useState<ProposalDetailType | null>(null);
  const [termsExpanded, setTermsExpanded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (proposal && !form) {
      const vis = parseTermsConfig(proposal.termsConfig);
      setTermsVisible(vis);
      // Detect mode from saved config
      const isBasic = TERMS_META.every(t => !t.inBasic || vis[t.key]) &&
        TERMS_META.filter(t => !t.inBasic).every(t => !vis[t.key]);
      setTermsMode(isBasic ? "basic" : "standard");

      setForm({
        projectName:     proposal.projectName ?? "",
        clientId:        proposal.clientId ? String(proposal.clientId) : "",
        status:          proposal.status ?? "draft",
        validUntil:      proposal.validUntil ?? "",
        introText:       proposal.introText ?? TERMS_DEFAULTS.introText ?? "",
        projectOverview: proposal.projectOverview ?? "",
        scopeOfWork:     proposal.scopeOfWork ?? "",
        exclusions:      proposal.exclusions ?? "",
        allowances:      proposal.allowances ?? "",
        deliverables:    proposal.deliverables ?? "",
        timeline:        proposal.timeline ?? "",
        paymentTerms:    proposal.paymentTerms ?? "",
        changeOrders:    proposal.changeOrders ?? TERMS_DEFAULTS.changeOrders ?? "",
        siteConditions:  proposal.siteConditions ?? TERMS_DEFAULTS.siteConditions ?? "",
        materials:       proposal.materials ?? TERMS_DEFAULTS.materials ?? "",
        permits:         proposal.permits ?? TERMS_DEFAULTS.permits ?? "",
        access:          proposal.access ?? TERMS_DEFAULTS.access ?? "",
        cleanup:         proposal.cleanup ?? TERMS_DEFAULTS.cleanup ?? "",
        warranty:        proposal.warranty ?? TERMS_DEFAULTS.warranty ?? "",
        cancellation:    proposal.cancellation ?? TERMS_DEFAULTS.cancellation ?? "",
        liability:       proposal.liability ?? TERMS_DEFAULTS.liability ?? "",
        notes:           proposal.notes ?? "",
        warrantyPeriod:  proposal.warrantyPeriod ?? "1 year",
      });
    }
  }, [proposal, form]);

  function switchTermsMode(mode: "basic" | "standard") {
    setTermsMode(mode);
    const vis = mode === "basic" ? { ...BASIC_VISIBLE } : { ...ALL_VISIBLE };
    setTermsVisible(vis);
    setDirty(true);
    scheduleAutoSave();
  }

  function toggleSection(key: string) {
    setTermsVisible(prev => {
      const next = { ...prev, [key]: !prev[key] };
      setDirty(true);
      scheduleAutoSave();
      return next;
    });
  }

  const mergedProposal = useMemo<ProposalDetailType | null>(() => {
    if (!form || !proposal) return null;
    return {
      ...proposal,
      projectName:     form.projectName || proposal.projectName,
      clientId:        form.clientId ? parseInt(form.clientId) : null,
      clientName:      clients.find(c => String(c.id) === form.clientId)?.name ?? proposal.clientName,
      status:          form.status,
      validUntil:      form.validUntil || null,
      introText:       form.introText || null,
      projectOverview: form.projectOverview || null,
      scopeOfWork:     form.scopeOfWork || null,
      exclusions:      form.exclusions || null,
      allowances:      form.allowances || null,
      deliverables:    form.deliverables || null,
      timeline:        form.timeline || null,
      paymentTerms:    form.paymentTerms || null,
      changeOrders:    form.changeOrders || null,
      siteConditions:  form.siteConditions || null,
      materials:       form.materials || null,
      permits:         form.permits || null,
      access:          form.access || null,
      cleanup:         form.cleanup || null,
      warranty:        form.warranty || null,
      cancellation:    form.cancellation || null,
      liability:       form.liability || null,
      termsConfig:     JSON.stringify(termsVisible),
      warrantyPeriod:  form.warrantyPeriod,
      terms:           null,
      notes:           form.notes || null,
    };
  }, [form, proposal, clients, termsVisible]);

  useEffect(() => {
    if (!mergedProposal) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => setPreviewData(mergedProposal), 1500);
    if (!previewData) setPreviewData(mergedProposal);
  }, [mergedProposal]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveNow = useCallback(async (f: FormState, p: ProposalDetailType, vis: Record<string, boolean>) => {
    setSaving(true);
    try {
      await updateProposal.mutateAsync({
        id: p.id,
        data: {
          projectName:     f.projectName || p.projectName,
          clientId:        f.clientId ? parseInt(f.clientId) : null,
          status:          f.status,
          validUntil:      f.validUntil || null,
          introText:       f.introText || null,
          projectOverview: f.projectOverview || null,
          scopeOfWork:     f.scopeOfWork || null,
          exclusions:      f.exclusions || null,
          allowances:      f.allowances || null,
          deliverables:    f.deliverables || null,
          timeline:        f.timeline || null,
          paymentTerms:    f.paymentTerms || null,
          changeOrders:    f.changeOrders || null,
          siteConditions:  f.siteConditions || null,
          materials:       f.materials || null,
          permits:         f.permits || null,
          access:          f.access || null,
          cleanup:         f.cleanup || null,
          warranty:        f.warranty || null,
          cancellation:    f.cancellation || null,
          liability:       f.liability || null,
          termsConfig:     JSON.stringify(vis),
          warrantyPeriod:  f.warrantyPeriod || "1 year",
          notes:           f.notes || null,
        },
      });
      setDirty(false);
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [updateProposal, toast]);

  function scheduleAutoSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setForm(prev => {
        setTermsVisible(vis => {
          if (prev && proposal) saveNow(prev, proposal, vis);
          return vis;
        });
        return prev;
      });
    }, 1500);
  }

  function update(key: keyof FormState, value: string) {
    setForm(prev => prev ? { ...prev, [key]: value } : prev);
    setDirty(true);
    scheduleAutoSave();
  }

  async function handleManualSave() {
    if (!form || !proposal) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await saveNow(form, proposal, termsVisible);
    toast({ title: "Proposal saved" });
  }

  async function streamEnhance(key: string): Promise<void> {
    if (!form) return;
    const currentText = (form as Record<string, string>)[key];
    if (!currentText?.trim()) return;
    setEnhancing(prev => ({ ...prev, [key]: true }));
    setForm(prev => prev ? { ...prev, [key]: "" } : prev);

    try {
      const res = await fetch(`${BASE}/api/proposals/enhance-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentText, section: key }),
      });
      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.done) break;
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.content) {
              accumulated += parsed.content;
              const snap = accumulated;
              setForm(prev => prev ? { ...prev, [key]: snap } : prev);
            }
          } catch { /* skip */ }
        }
      }
      setDirty(true);
      scheduleAutoSave();
    } catch {
      setForm(prev => prev ? { ...prev, [key]: currentText } : prev);
      toast({ title: `Failed to enhance section`, variant: "destructive" });
    } finally {
      setEnhancing(prev => ({ ...prev, [key]: false }));
    }
  }

  async function copyAllText() {
    if (!form) return;
    const lines: string[] = [];
    const allKeys = [...PROJECT_SECTIONS, ...TERMS_KEYS];
    for (const key of allKeys) {
      const text = (form as Record<string, string>)[key]?.trim();
      if (text) {
        lines.push(`--- ${(SECTION_LABELS[key as keyof FormState] ?? key).toUpperCase()} ---`);
        lines.push(text);
        lines.push("");
      }
    }
    if (!lines.length) { toast({ title: "No content to copy yet", variant: "destructive" }); return; }
    await navigator.clipboard.writeText(lines.join("\n"));
    toast({ title: "Copied to clipboard" });
  }

  async function enhanceAll() {
    if (!form) return;
    const filled = PROJECT_SECTIONS.filter(k => (form as Record<string, string>)[k]?.trim());
    if (!filled.length) { toast({ title: "Write some content first", variant: "destructive" }); return; }
    setEnhancingAll(true);
    toast({ title: `Enhancing ${filled.length} section${filled.length > 1 ? "s" : ""}…` });
    await Promise.all(filled.map(k => streamEnhance(k)));
    setEnhancingAll(false);
    toast({ title: "All sections enhanced" });
  }

  async function setStatus(status: string) {
    if (!form || !proposal) return;
    const updated = { ...form, status };
    setForm(updated);
    await saveNow(updated, proposal, termsVisible);
    toast({ title: `Marked as ${status}` });
  }

  async function handleDownloadPdf() {
    if (!mergedProposal) return;
    setPdfGenerating(true);
    try { await downloadProposalPdf(mergedProposal, pdfTemplate); }
    catch { toast({ title: "PDF generation failed", variant: "destructive" }); }
    finally { setPdfGenerating(false); }
  }

  if (isLoading || !form) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading proposal...
        </div>
      </AppLayout>
    );
  }

  if (!proposal) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground gap-3">
          <p>Proposal not found.</p>
          <Button variant="outline" onClick={() => navigate("/proposals")}>Back</Button>
        </div>
      </AppLayout>
    );
  }

  const anyEnhancing = Object.values(enhancing).some(Boolean);
  const visibleCount = Object.values(termsVisible).filter(Boolean).length;

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">

        {/* ── Top bar ──────────────────────────────────────────── */}
        <div className="border-b border-border bg-card/50 px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => navigate("/proposals")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm text-primary font-semibold">{proposal.proposalNumber}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[form.status] ?? STATUS_COLORS.draft}`}>
                  {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                </span>
                {dirty && <span className="text-xs text-muted-foreground italic hidden sm:inline">Unsaved</span>}
                {saving && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Saving…</span>}
              </div>
              <p className="text-sm text-muted-foreground truncate">{form.projectName || "Untitled Project"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
                  Status <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatus("draft")}><span className="w-2 h-2 rounded-full bg-muted-foreground mr-2 inline-block" />Draft</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatus("sent")}><Send className="w-3.5 h-3.5 mr-2 text-blue-400" />Mark Sent</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatus("accepted")}><Check className="w-3.5 h-3.5 mr-2 text-emerald-400" />Mark Accepted</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatus("rejected")} className="text-destructive"><X className="w-3.5 h-3.5 mr-2" />Mark Rejected</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" onClick={copyAllText}>
              <ClipboardCopy className="w-4 h-4" />
              <span className="hidden sm:inline">Copy All</span>
            </Button>

            <Button
              variant="outline" size="sm"
              className={`gap-1.5 border-primary/40 text-primary hover:bg-primary/10 ${anyEnhancing || enhancingAll ? "animate-pulse" : ""}`}
              onClick={enhanceAll}
              disabled={anyEnhancing || enhancingAll}
            >
              {anyEnhancing || enhancingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="hidden sm:inline">{enhancingAll ? "Enhancing…" : "Enhance All"}</span>
            </Button>

            <Button variant={previewOpen ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => setPreviewOpen(v => !v)}>
              {previewOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{previewOpen ? "Hide Preview" : "Preview"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => window.open(`${BASE}/proposals/${proposal.id}/preview`, "_blank")}
              title="Open full PDF preview in a new tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Open PDF</span>
            </Button>

            <Button size="sm" className="gap-1.5" onClick={handleManualSave} disabled={saving || !dirty}>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        </div>

        {/* ── Split body ───────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left: Form editor */}
          <div className={`flex-1 min-w-0 overflow-auto transition-all duration-300 ${previewOpen ? "max-w-[50%]" : ""}`}>
            <div className="max-w-2xl mx-auto p-6 space-y-6">

              {/* Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl border border-border bg-card">
                <div className="space-y-1.5">
                  <Label>Project Name</Label>
                  <Input value={form.projectName} onChange={e => update("projectName", e.target.value)} placeholder="Project name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Client</Label>
                  <Select value={form.clientId || "none"} onValueChange={v => update("clientId", v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Select client…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No client</SelectItem>
                      {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valid Until</Label>
                  <Input type="date" value={form.validUntil} onChange={e => update("validUntil", e.target.value)} />
                </div>
              </div>

              {/* Project sections */}
              <div className="space-y-5">
                {PROJECT_SECTIONS.map(key => (
                  <SectionField
                    key={key}
                    fieldKey={key}
                    label={SECTION_LABELS[key] ?? key}
                    placeholder={SECTION_PLACEHOLDERS[key]}
                    value={(form as Record<string, string>)[key]}
                    isEnhancing={!!enhancing[key]}
                    onChange={v => update(key, v)}
                  />
                ))}
              </div>

              {/* ── Standard Terms accordion ─────────────────────── */}
              <div className="rounded-xl border border-border overflow-hidden">

                {/* Accordion header */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
                  onClick={() => setTermsExpanded(v => !v)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-0.5 h-4 rounded bg-muted-foreground" />
                    <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Terms &amp; Conditions
                    </span>
                    <span className="text-xs text-muted-foreground/60 ml-1">
                      ({visibleCount} of {TERMS_KEYS.length} shown in PDF)
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${termsExpanded ? "rotate-90" : ""}`} />
                </button>

                {termsExpanded && (
                  <div className="border-t border-border bg-card">

                    {/* Mode selector + warranty period */}
                    <div className="px-5 pt-4 pb-3 flex flex-wrap items-center gap-3 border-b border-border/60">
                      {/* Mode toggle */}
                      <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-muted/30">
                        <button
                          type="button"
                          onClick={() => switchTermsMode("basic")}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            termsMode === "basic"
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Basic (6 sections)
                        </button>
                        <button
                          type="button"
                          onClick={() => switchTermsMode("standard")}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            termsMode === "standard"
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Standard (all 9)
                        </button>
                      </div>

                      {/* Warranty period */}
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-muted-foreground">Warranty period:</span>
                        <Select
                          value={form.warrantyPeriod || "1 year"}
                          onValueChange={v => update("warrantyPeriod", v)}
                        >
                          <SelectTrigger className="h-7 text-xs w-28 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WARRANTY_PERIODS.map(p => (
                              <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Per-section fields with toggle */}
                    <div className="p-5 space-y-5">
                      {TERMS_META.map(meta => {
                        const isVisible = !!termsVisible[meta.key];
                        const isEnhancing = !!enhancing[meta.key];
                        const val = (form as Record<string, string>)[meta.key] ?? "";

                        return (
                          <div key={meta.key} className={`space-y-2 transition-opacity ${!isVisible ? "opacity-40" : ""}`}>
                            {/* Header row */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={`w-0.5 h-4 rounded flex-shrink-0 ${isVisible ? "bg-muted-foreground" : "bg-muted"}`} />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                      {meta.label}
                                    </Label>
                                    {isEnhancing && (
                                      <span className="flex items-center gap-1 text-xs text-primary">
                                        <Sparkles className="w-3 h-3 animate-pulse" /> Enhancing…
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground/60 mt-0.5">{meta.helper}</p>
                                </div>
                              </div>
                              {/* Show/hide toggle */}
                              <button
                                type="button"
                                onClick={() => toggleSection(meta.key)}
                                className={`flex-shrink-0 p-1 rounded transition-colors ${
                                  isVisible
                                    ? "text-muted-foreground hover:text-foreground"
                                    : "text-muted hover:text-muted-foreground"
                                }`}
                                title={isVisible ? "Hide from PDF" : "Show in PDF"}
                              >
                                {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {/* Text area — only shown when visible */}
                            {isVisible && (
                              <Textarea
                                value={val}
                                onChange={e => update(meta.key as keyof FormState, e.target.value)}
                                disabled={isEnhancing}
                                className={`min-h-[72px] resize-y font-sans text-sm leading-relaxed ${
                                  isEnhancing
                                    ? "bg-primary/5 border-primary/30 text-foreground/60 cursor-wait"
                                    : "bg-muted/20 border-border"
                                }`}
                              />
                            )}

                            {!isVisible && (
                              <p className="text-xs text-muted-foreground/40 pl-5 italic">Hidden — not shown in PDF</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Internal notes */}
              <div className="space-y-2 pb-6">
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-4 rounded bg-muted-foreground/40" />
                  <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground/60">
                    Internal Notes
                  </Label>
                  <span className="text-xs text-muted-foreground/40">(not shown in PDF)</span>
                </div>
                <Textarea
                  value={form.notes}
                  onChange={e => update("notes", e.target.value)}
                  placeholder={SECTION_PLACEHOLDERS.notes}
                  className="min-h-[80px] resize-y bg-muted/30 border-border font-sans text-sm"
                />
              </div>
            </div>
          </div>

          {/* Right: PDF preview */}
          {previewOpen && previewData && (
            <div className="w-[50%] flex-shrink-0 flex flex-col min-h-0 overflow-hidden">
              <PdfPreviewPanel
                proposal={previewData}
                template={pdfTemplate}
                onTemplateChange={setPdfTemplate}
                onDownload={handleDownloadPdf}
                downloading={pdfGenerating}
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
