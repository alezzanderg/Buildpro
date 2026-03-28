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

type FormState = {
  projectName: string; clientId: string; status: string; validUntil: string;
  // Project sections
  introText: string; projectOverview: string; scopeOfWork: string;
  exclusions: string; allowances: string; deliverables: string;
  timeline: string; paymentTerms: string;
  // Standard terms
  changeOrders: string; siteConditions: string; materials: string;
  permits: string; access: string; cleanup: string;
  warranty: string; cancellation: string; liability: string;
  // Internal
  notes: string;
};

// Sections shown in PDF and enhanced by AI
const PROJECT_SECTIONS: (keyof FormState)[] = [
  "introText", "projectOverview", "scopeOfWork", "exclusions",
  "allowances", "deliverables", "timeline", "paymentTerms",
];
const TERMS_SECTIONS: (keyof FormState)[] = [
  "changeOrders", "siteConditions", "materials", "permits",
  "access", "cleanup", "warranty", "cancellation", "liability",
];
const ALL_TEXT_SECTIONS = [...PROJECT_SECTIONS, ...TERMS_SECTIONS];

const SECTION_LABELS: Partial<Record<keyof FormState, string>> = {
  introText:       "Introduction",
  projectOverview: "Project Overview",
  scopeOfWork:     "Scope of Work",
  exclusions:      "Exclusions",
  allowances:      "Allowances & Selections",
  deliverables:    "Deliverables",
  timeline:        "Timeline",
  paymentTerms:    "Payment Terms",
  changeOrders:    "Change Orders",
  siteConditions:  "Site Conditions",
  materials:       "Materials & Substitutions",
  permits:         "Permits, Codes & Approvals",
  access:          "Access & Jobsite Conditions",
  cleanup:         "Cleanup & Disposal",
  warranty:        "Warranty / Guarantee",
  cancellation:    "Cancellation / Rescheduling",
  liability:       "Limitation of Liability",
  notes:           "Internal Notes",
};

const SECTION_PLACEHOLDERS: Partial<Record<keyof FormState, string>> = {
  introText:       "Thank you for the opportunity to submit this proposal...",
  projectOverview: "The purpose of this project is to...",
  scopeOfWork:     "The work included in this proposal consists of the following:\n\n- Demolition & removal of existing materials\n- Installation of new materials",
  exclusions:      "Unless specifically listed in the scope, the following are excluded:\n\n- Permits and engineering\n- Hidden damage or mold remediation",
  allowances:      "The following items require final owner selection or approval:\n\n- Tile and finish selections\n- Fixture models and finishes",
  deliverables:    "Upon completion, deliverables will include:\n\n- Completion of agreed scope\n- Debris removal from work areas",
  timeline:        "- Preparation: 1 day\n- Demolition: 1–2 days\n- Installation: 3–5 days\n- Final walkthrough: 1 day",
  paymentTerms:    "50% deposit due upon acceptance.\n25% at project midpoint.\n25% due upon substantial completion.",
  changeOrders:    "Any work outside the original scope must be approved in writing...",
  siteConditions:  "This proposal is based on visible conditions at time of estimate...",
  materials:       "Materials will be installed as specified or based on approved selections...",
  permits:         "Unless explicitly stated, permits and engineering are excluded...",
  access:          "The client agrees to provide reasonable access during working hours...",
  cleanup:         "Basic jobsite cleanup is included...",
  warranty:        "We warrant our workmanship for one (1) year from substantial completion...",
  cancellation:    "Deposits may be non-refundable once scheduling or materials have begun...",
  liability:       "Our liability is limited to the value of contracted work performed...",
  notes:           "Internal notes — not shown on the PDF.",
};

// Default boilerplate text pre-populated for terms sections
const TERMS_DEFAULTS: Partial<Record<keyof FormState, string>> = {
  changeOrders:  "Any work requested by the client that is outside the original scope of work must be documented and approved in writing before the additional work is performed. Change orders may affect pricing, material needs, and project duration.",
  siteConditions:"This proposal is based on visible conditions at the time of the estimate. We are not responsible for hidden or concealed conditions including structural deficiencies, water damage, code violations, pest damage, mold, rot, deteriorated framing, outdated utilities, or inaccessible systems discovered after work begins. Any such conditions will be brought to the client's attention and may require additional work and cost.",
  materials:     "Materials will be installed as specified in the proposal or based on approved selections. If a specified material becomes unavailable, a comparable substitute may be recommended for client approval. Delays caused by backorders, discontinued products, or supplier issues may impact the project timeline.",
  permits:       "Unless explicitly stated otherwise, permits, plans, engineering, and municipal approvals are excluded from this proposal. Work will be performed in accordance with standard trade practices; however, any required upgrades related to code compliance discovered during the project may result in additional charges if not included in the original scope.",
  access:        "The client agrees to provide reasonable access to the work area during normal working hours and to ensure that water, electricity, and any other necessary utilities are available unless otherwise agreed. The work area should be reasonably cleared of personal items, furniture, valuables, and obstacles prior to the start of work.",
  cleanup:       "Basic jobsite cleanup is included unless otherwise stated. This includes removal of construction debris generated by our work from active work areas. Deep cleaning, specialized disposal, hazardous waste handling, and off-site hauling beyond standard debris removal are excluded unless specifically listed in the proposal.",
  warranty:      "We warrant our workmanship for a period of one (1) year from the date of substantial completion, covering defects caused by installation or labor performed by our company under normal use conditions. This warranty does not cover owner abuse, misuse, neglect, manufacturer defects, normal wear and tear, or damage caused by third parties or conditions outside our control.",
  cancellation:  "Deposits may be non-refundable once scheduling, material ordering, fabrication, or mobilization has begun. If the client cancels the project after acceptance and before completion, the client agrees to pay for work performed, materials ordered, restocking fees, and any costs incurred up to the cancellation date.",
  liability:     "Our liability under this proposal shall be limited to the value of the contracted work actually performed. We shall not be liable for incidental, indirect, special, or consequential damages, delays outside our control, or pre-existing conditions not caused by our work.",
};

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

// ── Section editor row ────────────────────────────────────────────────
function SectionField({
  fieldKey, value, isEnhancing, onChange,
}: {
  fieldKey: keyof FormState;
  value: string;
  isEnhancing: boolean;
  onChange: (v: string) => void;
}) {
  const label = SECTION_LABELS[fieldKey] ?? fieldKey;
  const placeholder = SECTION_PLACEHOLDERS[fieldKey] ?? "";
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
        placeholder={placeholder}
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
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdfTemplate, setPdfTemplate] = useState<PdfTemplate>("classic");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [enhancingAll, setEnhancingAll] = useState(false);
  const [previewData, setPreviewData] = useState<ProposalDetailType | null>(null);
  const [termsExpanded, setTermsExpanded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (proposal && !form) {
      setForm({
        projectName:     proposal.projectName ?? "",
        clientId:        proposal.clientId ? String(proposal.clientId) : "",
        status:          proposal.status ?? "draft",
        validUntil:      proposal.validUntil ?? "",
        introText:       proposal.introText ?? "Thank you for the opportunity to provide this proposal for your project. Our goal is to deliver professional workmanship, clear communication, and an organized process from start to finish. This proposal outlines the scope of work, project assumptions, estimated timeline, payment terms, and conditions associated with the services requested.\n\nWe are committed to completing the work in a professional and timely manner while maintaining jobsite safety, cleanliness, and respect for the property. Any client-specific requests, selections, or special considerations should be documented and approved before work begins.",
        projectOverview: proposal.projectOverview ?? "",
        scopeOfWork:     proposal.scopeOfWork ?? "",
        exclusions:      proposal.exclusions ?? "",
        allowances:      proposal.allowances ?? "",
        deliverables:    proposal.deliverables ?? "",
        timeline:        proposal.timeline ?? "",
        paymentTerms:    proposal.paymentTerms ?? "",
        // Fall back to boilerplate defaults for terms sections
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
      });
    }
  }, [proposal, form]);

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
      terms:           null,
      notes:           form.notes || null,
    };
  }, [form, proposal, clients]);

  useEffect(() => {
    if (!mergedProposal) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      setPreviewData(mergedProposal);
    }, 1500);
    if (!previewData) setPreviewData(mergedProposal);
  }, [mergedProposal]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveNow = useCallback(async (f: FormState, p: ProposalDetailType) => {
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

  function update(key: keyof FormState, value: string) {
    setForm(prev => prev ? { ...prev, [key]: value } : prev);
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setForm(prev => {
        if (prev && proposal) saveNow(prev, proposal);
        return prev;
      });
    }, 1500);
  }

  async function handleManualSave() {
    if (!form || !proposal) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await saveNow(form, proposal);
    toast({ title: "Proposal saved" });
  }

  async function streamEnhance(key: keyof FormState): Promise<void> {
    if (!form) return;
    const currentText = form[key];
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
          } catch { /* skip malformed */ }
        }
      }
      setDirty(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        setForm(prev => { if (prev && proposal) saveNow(prev, proposal); return prev; });
      }, 1500);
    } catch {
      setForm(prev => prev ? { ...prev, [key]: currentText } : prev);
      toast({ title: `Failed to enhance ${SECTION_LABELS[key] ?? key}`, variant: "destructive" });
    } finally {
      setEnhancing(prev => ({ ...prev, [key]: false }));
    }
  }

  async function copyAllText() {
    if (!form) return;
    const lines: string[] = [];
    for (const key of ALL_TEXT_SECTIONS) {
      const text = form[key]?.trim();
      if (text) {
        lines.push(`--- ${(SECTION_LABELS[key] ?? key).toUpperCase()} ---`);
        lines.push(text);
        lines.push("");
      }
    }
    if (!lines.length) {
      toast({ title: "No content to copy yet", variant: "destructive" });
      return;
    }
    await navigator.clipboard.writeText(lines.join("\n"));
    toast({ title: "Copied to clipboard", description: "All sections copied as plain text." });
  }

  // Enhance All: only project sections by default (terms sections have boilerplate)
  async function enhanceAll() {
    if (!form) return;
    const filled = PROJECT_SECTIONS.filter(k => form[k]?.trim());
    if (!filled.length) {
      toast({ title: "Write some content first before enhancing", variant: "destructive" });
      return;
    }
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
    await saveNow(updated, proposal);
    toast({ title: `Marked as ${status}` });
  }

  async function handleDownloadPdf() {
    if (!mergedProposal) return;
    setPdfGenerating(true);
    try {
      await downloadProposalPdf(mergedProposal, pdfTemplate);
    } catch {
      toast({ title: "PDF generation failed", variant: "destructive" });
    } finally {
      setPdfGenerating(false);
    }
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

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={copyAllText}
              title="Copy all section text to clipboard"
            >
              <ClipboardCopy className="w-4 h-4" />
              <span className="hidden sm:inline">Copy All</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={`gap-1.5 border-primary/40 text-primary hover:bg-primary/10 ${anyEnhancing || enhancingAll ? "animate-pulse" : ""}`}
              onClick={enhanceAll}
              disabled={anyEnhancing || enhancingAll}
            >
              {anyEnhancing || enhancingAll
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Sparkles className="w-4 h-4" />}
              <span className="hidden sm:inline">{enhancingAll ? "Enhancing…" : "Enhance All"}</span>
            </Button>

            <Button
              variant={previewOpen ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setPreviewOpen(v => !v)}
            >
              {previewOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{previewOpen ? "Hide Preview" : "Preview"}</span>
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

              {/* Meta fields */}
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

              {/* ── Project sections ────────────────────────────── */}
              <div className="space-y-5">
                {PROJECT_SECTIONS.map(key => (
                  <SectionField
                    key={key}
                    fieldKey={key}
                    value={form[key]}
                    isEnhancing={!!enhancing[key]}
                    onChange={v => update(key, v)}
                  />
                ))}
              </div>

              {/* ── Standard Terms (collapsible) ─────────────────── */}
              <div className="rounded-xl border border-border overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
                  onClick={() => setTermsExpanded(v => !v)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-0.5 h-4 rounded bg-muted-foreground" />
                    <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Standard Terms &amp; Conditions
                    </span>
                    <span className="text-xs text-muted-foreground/60 ml-1">({TERMS_SECTIONS.length} sections)</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-muted-foreground transition-transform ${termsExpanded ? "rotate-90" : ""}`}
                  />
                </button>

                {termsExpanded && (
                  <div className="p-5 space-y-5 border-t border-border bg-card">
                    <p className="text-xs text-muted-foreground">
                      These sections are pre-filled with standard boilerplate language. Edit as needed — all sections appear in the PDF.
                    </p>
                    {TERMS_SECTIONS.map(key => (
                      <SectionField
                        key={key}
                        fieldKey={key}
                        value={form[key]}
                        isEnhancing={!!enhancing[key]}
                        onChange={v => update(key, v)}
                      />
                    ))}
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
