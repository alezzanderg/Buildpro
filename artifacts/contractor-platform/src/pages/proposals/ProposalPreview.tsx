import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { PDFViewer } from "@react-pdf/renderer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Loader2, Palette } from "lucide-react";
import { useGetProposal } from "@/hooks/useProposals";
import { ProposalPdfDocument, downloadProposalPdf, PDF_TEMPLATES } from "@/lib/proposalPdf";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import type { PdfTemplate } from "@/lib/proposalPdf";

export default function ProposalPreview() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [template, setTemplate] = useState<PdfTemplate>("classic");
  const [downloading, setDownloading] = useState(false);

  const { data: proposal, isLoading } = useGetProposal(parseInt(id ?? "0"), {
    enabled: !!id,
  });

  const { settings } = useCompanySettings();

  // Pass absolute URL directly — react-pdf's Image component fetches it in its worker
  const logoSrc = settings.logoUrl
    ? `${window.location.origin}/api/storage${settings.logoUrl}`
    : undefined;

  async function handleDownload() {
    if (!proposal) return;
    setDownloading(true);
    try {
      await downloadProposalPdf(proposal, template);
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <p>Proposal not found.</p>
        <Button variant="outline" onClick={() => navigate("/proposals")}>
          Back to proposals
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(`/proposals/${id}`)}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to editor
          </Button>
          <div className="h-4 w-px bg-border" />
          <div>
            <span className="font-mono text-xs text-primary font-semibold">{proposal.proposalNumber}</span>
            <span className="text-sm text-muted-foreground ml-2">{proposal.projectName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <Select value={template} onValueChange={v => setTemplate(v as PdfTemplate)}>
              <SelectTrigger className="h-8 text-xs w-32 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PDF_TEMPLATES.map(t => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" className="gap-2" onClick={handleDownload} disabled={downloading}>
            {downloading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />
            }
            {downloading ? "Generating…" : "Download PDF"}
          </Button>
        </div>
      </header>

      {/* Full-screen PDF viewer */}
      <div className="flex-1 min-h-0">
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <ProposalPdfDocument proposal={proposal} template={template} logoSrc={logoSrc} />
        </PDFViewer>
      </div>
    </div>
  );
}
