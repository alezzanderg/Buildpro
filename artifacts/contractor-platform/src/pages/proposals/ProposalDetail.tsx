import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Download,
  Eye,
  ChevronDown,
  Send,
  Check,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useGetProposal, useUpdateProposal } from "@/hooks/useProposals";
import { useListClients } from "@workspace/api-client-react";
import { downloadProposalPdf, PDF_TEMPLATES } from "@/lib/proposalPdf";
import type { PdfTemplate } from "@/lib/proposalPdf";
import type { ProposalDetail as ProposalDetailType } from "@/hooks/useProposals";

const STATUS_COLORS: Record<string, string> = {
  draft:    "bg-muted text-muted-foreground",
  sent:     "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  accepted: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-400 border border-red-500/30",
};

type FormState = {
  projectName: string;
  clientId: string;
  status: string;
  validUntil: string;
  introText: string;
  scopeOfWork: string;
  deliverables: string;
  timeline: string;
  paymentTerms: string;
  terms: string;
  notes: string;
};

function sectionLabel(key: keyof FormState): string {
  const map: Partial<Record<keyof FormState, string>> = {
    introText:    "Introduction",
    scopeOfWork:  "Scope of Work",
    deliverables: "Deliverables",
    timeline:     "Timeline",
    paymentTerms: "Payment Terms",
    terms:        "Terms & Conditions",
    notes:        "Internal Notes",
  };
  return map[key] ?? key;
}

function sectionPlaceholder(key: keyof FormState): string {
  const map: Partial<Record<keyof FormState, string>> = {
    introText:    "Thank you for the opportunity to submit this proposal. We are excited to bring our expertise to your project...",
    scopeOfWork:  "The scope of this project includes...\n\n• Item 1\n• Item 2\n• Item 3",
    deliverables: "Upon completion, we will deliver:\n\n• Deliverable 1\n• Deliverable 2",
    timeline:     "Week 1-2: Site preparation and demolition\nWeek 3-4: Framing and rough-in\n...",
    paymentTerms: "50% deposit required upon contract signing.\n50% due upon completion.",
    terms:        "All work will be completed in a professional manner. Client is responsible for permits unless otherwise agreed...",
    notes:        "Internal notes — not shown on the PDF.",
  };
  return map[key] ?? "";
}

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
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  // Initialize form from proposal data
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

  async function streamEnhance(key: keyof FormState) {
    if (!form) return;
    const currentText = form[key];
    if (!currentText?.trim()) {
      toast({ title: "Please write some text first before enhancing", variant: "destructive" });
      return;
    }
    setEnhancing(prev => ({ ...prev, [key]: true }));
    setForm(prev => prev ? { ...prev, [key]: "" } : prev);

    try {
      const res = await fetch(`${BASE}/api/proposals/enhance-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentText, section: key }),
      });
      if (!res.ok || !res.body) throw new Error("Failed to connect");

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
          const json = line.slice(6);
          try {
            const parsed = JSON.parse(json);
            if (parsed.done) break;
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.content) {
              accumulated += parsed.content;
              const snapshot = accumulated;
              setForm(prev => prev ? { ...prev, [key]: snapshot } : prev);
            }
          } catch { /* skip malformed */ }
        }
      }

      setDirty(true);
      if (accumulated) {
        const final = accumulated;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          setForm(prev => {
            if (prev && proposal) saveNow(prev, proposal);
            return prev;
          });
        }, 1500);
        toast({ title: "Text enhanced by AI" });
      }
    } catch {
      setForm(prev => prev ? { ...prev, [key]: currentText } : prev);
      toast({ title: "AI enhance failed. Please try again.", variant: "destructive" });
    } finally {
      setEnhancing(prev => ({ ...prev, [key]: false }));
    }
  }

  async function setStatus(status: string) {
    if (!form || !proposal) return;
    const updated = { ...form, status };
    setForm(updated);
    await saveNow(updated, proposal);
    toast({ title: `Marked as ${status}` });
  }

  async function handleDownloadPdf() {
    if (!proposal || !form) return;
    setPdfGenerating(true);
    try {
      const merged: ProposalDetailType = {
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
      await downloadProposalPdf(merged, pdfTemplate);
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
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading proposal...
        </div>
      </AppLayout>
    );
  }

  if (!proposal) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground gap-3">
          <p>Proposal not found.</p>
          <Button variant="outline" onClick={() => navigate("/proposals")}>Back to Proposals</Button>
        </div>
      </AppLayout>
    );
  }

  const TEXT_SECTIONS: (keyof FormState)[] = ["introText", "scopeOfWork", "deliverables", "timeline", "paymentTerms", "terms"];

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="border-b border-border bg-card/50 px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/proposals")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-primary font-semibold">{proposal.proposalNumber}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[form.status] ?? STATUS_COLORS.draft}`}>
                  {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                </span>
                {dirty && <span className="text-xs text-muted-foreground italic">Unsaved changes</span>}
                {saving && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Saving...</span>}
              </div>
              <p className="text-sm text-muted-foreground truncate max-w-xs">{form.projectName || "Untitled Project"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
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

            {/* PDF */}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPdfOpen(true)}>
              <Eye className="w-4 h-4" />
              PDF
            </Button>

            <Button size="sm" className="gap-1.5" onClick={handleManualSave} disabled={saving || !dirty}>
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">

            {/* Meta fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl border border-border bg-card">
              <div className="space-y-1.5">
                <Label>Project Name</Label>
                <Input
                  value={form.projectName}
                  onChange={e => update("projectName", e.target.value)}
                  placeholder="Project name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Select value={form.clientId || "none"} onValueChange={v => update("clientId", v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={form.validUntil}
                  onChange={e => update("validUntil", e.target.value)}
                />
              </div>
            </div>

            {/* Text sections */}
            <div className="space-y-5">
              {TEXT_SECTIONS.map(key => {
                const isEnhancing = !!enhancing[key];
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-0.5 h-4 rounded bg-primary" />
                        <Label className="text-sm font-semibold uppercase tracking-wide text-foreground">
                          {sectionLabel(key)}
                        </Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1.5 text-xs h-7 px-2.5 transition-all ${
                          isEnhancing
                            ? "text-primary animate-pulse cursor-not-allowed"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        }`}
                        onClick={() => streamEnhance(key)}
                        disabled={isEnhancing}
                        title="Enhance with AI"
                      >
                        {isEnhancing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        {isEnhancing ? "Enhancing..." : "AI Enhance"}
                      </Button>
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
                      {isEnhancing && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs text-primary bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full border border-primary/20">
                          <Sparkles className="w-3 h-3 animate-pulse" />
                          AI writing...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Internal notes */}
            <div className="space-y-2">
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
      </div>

      {/* PDF Sheet */}
      <Sheet open={pdfOpen} onOpenChange={setPdfOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>Generate PDF</SheetTitle>
            <SheetDescription>
              Choose a template and download the proposal as a PDF.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 flex-1">
            <Label>Template</Label>
            <div className="grid grid-cols-1 gap-2">
              {PDF_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setPdfTemplate(t.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                    pdfTemplate === t.id
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 border-2 ${pdfTemplate === t.id ? "bg-primary border-primary" : "border-muted-foreground"}`} />
                  <div>
                    <p className="font-medium text-sm">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleDownloadPdf}
            disabled={pdfGenerating}
          >
            {pdfGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {pdfGenerating ? "Generating..." : "Download PDF"}
          </Button>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
