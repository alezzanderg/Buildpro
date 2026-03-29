import { PDFDocument } from "pdf-lib";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import type { ProposalDetail } from "@/hooks/useProposals";
import type { EstimateDetail } from "@workspace/api-client-react";
import { ProposalPdfDocument, type PdfTemplate as ProposalTemplate } from "./proposalPdf";
import { EstimatePdfDocument, type PdfTemplate as EstimateTemplate } from "./estimatePdf";
import { fetchLogoDataUrl } from "@/hooks/useCompanySettings";

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

export async function downloadBundlePdf(
  proposal: ProposalDetail,
  estimate: EstimateDetail,
  proposalTemplate: ProposalTemplate = "classic",
  estimateTemplate: EstimateTemplate = "classic",
): Promise<void> {
  const logoSrc = await fetchLogoDataUrl();
  const logoArg = logoSrc ?? undefined;

  const [proposalBlob, estimateBlob] = await Promise.all([
    pdf(
      createElement(ProposalPdfDocument, { proposal, template: proposalTemplate, logoSrc: logoArg }),
    ).toBlob(),
    pdf(
      createElement(EstimatePdfDocument, { estimate, template: estimateTemplate, logoSrc: logoArg }),
    ).toBlob(),
  ]);

  const [proposalBytes, estimateBytes] = await Promise.all([
    blobToUint8Array(proposalBlob),
    blobToUint8Array(estimateBlob),
  ]);

  const merged = await PDFDocument.create();
  const [proposalDoc, estimateDoc] = await Promise.all([
    PDFDocument.load(proposalBytes),
    PDFDocument.load(estimateBytes),
  ]);

  const proposalPages = await merged.copyPages(proposalDoc, proposalDoc.getPageIndices());
  proposalPages.forEach(p => merged.addPage(p));

  const estimatePages = await merged.copyPages(estimateDoc, estimateDoc.getPageIndices());
  estimatePages.forEach(p => merged.addPage(p));

  const mergedBytes = await merged.save();
  const blob = new Blob([mergedBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${proposal.proposalNumber} - ${proposal.projectName} (Bundle).pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
