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
  Send, Check, X, Loader2, Sparkles, Palette,
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
  introText: string; scopeOfWork: string; deliverables: string;
  timeline: string; paymentTerms: string; terms: string; notes: string;
};

const TEXT_SECTIONS: (keyof FormState)[] = [
  "introText", "scopeOfWork", "deliverables", "timeline", "paymentTerms", "terms",
];

function sectionLabel(key: keyof FormState): string {
  const map: Partial<Record<keyof FormState, string>> = {
    introText: "Introduction", scopeOfWork: "Scope of Work", deliverables: "Deliverables",
    timeline: "Timeline", paymentTerms: "Payment Terms", terms: "Terms & Conditions",
    notes: "Internal Notes",
  };
  return map[key] ?? key;
}

function sectionPlaceholder(key: keyof FormState): string {
  const map: Partial<Record<keyof FormState, string>> = {
    introText:    "Thank you for the opportunity to submit this proposal...",
    scopeOfWork:  "The scope of this project includes...\n\n• Item 1\n• Item 2",
    deliverables: "Upon completion, we will deliver:\n\n• Deliverable 1",
    timeline:     "Week 1-2: Site preparation and demolition\nWeek 3-4: Framing...",
    paymentTerms: "50% deposit required upon contract signing.\n50% due upon completion.",
    terms:        "All work will be completed in a professional manner...",
    notes:        "Internal notes — not shown on the PDF.",
  };
  return map[key] ?? "";
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
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">PDF Preview</span>
        </div>
        {/* Template selector */}
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

      {/* PDF viewer */}
      <div className="flex-1 overflow-hidden">
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <ProposalPdfDocument proposal={proposal} template={template} />
        </PDFViewer>
      </div>

      {/* Download button */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <Button className="w-full gap-2" onClick={onDownload} disabled={downloading}>
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading ? "Generating..." : "Download PDF"}
        </Button>
      </div>
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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (proposal && !form) {
      setForm({
        projectName:  proposal.projectName ?? "",
        clientId:     proposal.clientId ? String(proposal.clientId) : "",
        status:       proposal.status ?? "draft",
        validUntil:   proposal.validUntil ?? "",
        introText:    proposal.introText ?? "",
        scopeOfWork:  proposal.scopeOfWork ?? "",
        deliverables: proposal.deliverables ?? "",
        timeline:     proposal.timeline ?? "",
        paymentTerms: proposal.paymentTerms ?? "",
        terms:        proposal.terms ?? "",
        notes:        proposal.notes ?? "",
      });
    }
  }, [proposal, form]);

  // Build merged proposal from current form state
  const mergedProposal = useMemo<ProposalDetailType | null>(() => {
    if (!form || !proposal) return null;
    return {
      ...proposal,
      projectName:  form.projectName || proposal.projectName,
      clientId:     form.clientId ? parseInt(form.clientId) : null,
      clientName:   clients.find(c => String(c.id) === form.clientId)?.name ?? proposal.clientName,
      status:       form.status,
      validUntil:   form.validUntil || null,
      introText:    form.introText || null,
      scopeOfWork:  form.scopeOfWork || null,
      deliverables: form.deliverables || null,
      timeline:     form.timeline || null,
      paymentTerms: form.paymentTerms || null,
      terms:        form.terms || null,
      notes:        form.notes || null,
    };
  }, [form, proposal, clients]);

  // Sync previewData with debounce — 1.5s after typing stops
  useEffect(() => {
    if (!mergedProposal) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      setPreviewData(mergedProposal);
    }, 1500);
    // Immediately sync on first open
    if (!previewData) setPreviewData(mergedProposal);
  }, [mergedProposal]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveNow = useCallback(async (f: FormState, p: ProposalDetailType) => {
    setSaving(true);
    try {
      await updateProposal.mutateAsync({
        id: p.id,
        data: {
          projectName:  f.projectName || p.projectName,
          clientId:     f.clientId ? parseInt(f.clientId) : null,
          status:       f.status,
          validUntil:   f.validUntil || null,
          introText:    f.introText || null,
          scopeOfWork:  f.scopeOfWork || null,
          deliverables: f.deliverables || null,
          timeline:     f.timeline || null,
          paymentTerms: f.paymentTerms || null,
          terms:        f.terms || null,
          notes:        f.notes || null,
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

  // Stream-enhance a single section
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
      if (accumulated && saveTimer.current !== null) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          setForm(prev => { if (prev && proposal) saveNow(prev, proposal); return prev; });
        }, 1500);
      }
    } catch {
      setForm(prev => prev ? { ...prev, [key]: currentText } : prev);
      toast({ title: `Failed to enhance ${sectionLabel(key)}`, variant: "destructive" });
    } finally {
      setEnhancing(prev => ({ ...prev, [key]: false }));
    }
  }

  // Enhance all filled sections in parallel
  async function enhanceAll() {
    if (!form) return;
    const filled = TEXT_SECTIONS.filter(k => form[k]?.trim());
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
            {/* Status */}
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

            {/* Enhance All */}
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

            {/* Preview toggle */}
            <Button
              variant={previewOpen ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setPreviewOpen(v => !v)}
            >
              {previewOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{previewOpen ? "Hide Preview" : "Preview"}</span>
            </Button>

            {/* Save */}
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

              {/* Text sections — no individual AI buttons */}
              <div className="space-y-5">
                {TEXT_SECTIONS.map(key => {
                  const isEnhancing = !!enhancing[key];
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-0.5 h-4 rounded bg-primary" />
                        <Label className="text-sm font-semibold uppercase tracking-wide text-foreground">
                          {sectionLabel(key)}
                        </Label>
                        {isEnhancing && (
                          <span className="flex items-center gap-1 text-xs text-primary ml-auto">
                            <Sparkles className="w-3 h-3 animate-pulse" /> Enhancing…
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Textarea
                          value={form[key]}
                          onChange={e => update(key, e.target.value)}
                          placeholder={sectionPlaceholder(key)}
                          disabled={isEnhancing}
                          className={`min-h-[120px] resize-y font-sans text-sm leading-relaxed transition-all ${
                            isEnhancing
                              ? "bg-primary/5 border-primary/30 text-foreground/60 cursor-wait"
                              : "bg-card border-border"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Internal notes */}
              <div className="space-y-2 pb-6">
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-4 rounded bg-muted-foreground" />
                  <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Internal Notes
                  </Label>
                  <span className="text-xs text-muted-foreground/60">(not shown in PDF)</span>
                </div>
                <Textarea
                  value={form.notes}
                  onChange={e => update("notes", e.target.value)}
                  placeholder={sectionPlaceholder("notes")}
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
