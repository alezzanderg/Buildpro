import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { ProposalDetail } from "@/hooks/useProposals";
import { loadCompanySettings } from "@/hooks/useCompanySettings";
import type { PdfTemplate } from "./estimatePdf";

export { PDF_TEMPLATES } from "./estimatePdf";
export type { PdfTemplate };

const R = "Helvetica";
const B = "Helvetica-Bold";

function dt(s: string | null | undefined) {
  if (!s) return "";
  try { return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return s; }
}

// ── Status badge colors ────────────────────────────────────────────────
function sc(status: string) {
  const m: Record<string, { bg: string; bd: string; tx: string }> = {
    draft:    { bg: "#F8FAFC", bd: "#CBD5E1", tx: "#64748B" },
    sent:     { bg: "#EFF6FF", bd: "#BFDBFE", tx: "#1D4ED8" },
    accepted: { bg: "#ECFDF5", bd: "#A7F3D0", tx: "#065F46" },
    rejected: { bg: "#FEF2F2", bd: "#FECACA", tx: "#DC2626" },
  };
  return m[status?.toLowerCase()] ?? m.draft;
}

// ── Theme palette by template ─────────────────────────────────────────
type Theme = {
  headerBg: string; headerText: string; accent: string; accentSoft: string;
  sectionBg: string; bodyText: string; mutedText: string; border: string;
  sigBg: string; sigBorder: string;
};

function getTheme(template: PdfTemplate): Theme {
  switch (template) {
    case "modern":     return { headerBg: "#FFFFFF", headerText: "#0F172A", accent: "#F59E0B", accentSoft: "#FEF3C7", sectionBg: "#FFFBEB", bodyText: "#1E293B", mutedText: "#64748B", border: "#E2E8F0", sigBg: "#FFFBEB", sigBorder: "#F59E0B" };
    case "executive":  return { headerBg: "#0F172A", headerText: "#FFFFFF", accent: "#F59E0B", accentSoft: "#1E293B", sectionBg: "#0F172A", bodyText: "#FFFFFF", mutedText: "#94A3B8", border: "#1E293B", sigBg: "#1E293B", sigBorder: "#F59E0B" };
    case "slate":      return { headerBg: "#1E3A5F", headerText: "#FFFFFF", accent: "#3B82F6", accentSoft: "#EFF6FF", sectionBg: "#F0F7FF", bodyText: "#1E293B", mutedText: "#64748B", border: "#BFDBFE", sigBg: "#EFF6FF", sigBorder: "#3B82F6" };
    case "minimal":    return { headerBg: "#FFFFFF", headerText: "#000000", accent: "#000000", accentSoft: "#F8F8F8", sectionBg: "#F8F8F8", bodyText: "#111111", mutedText: "#666666", border: "#DDDDDD", sigBg: "#F8F8F8", sigBorder: "#AAAAAA" };
    case "blueprint":  return { headerBg: "#0D1B2A", headerText: "#F1C40F", accent: "#F1C40F", accentSoft: "#1A2C40", sectionBg: "#1A2C40", bodyText: "#E2E8F0", mutedText: "#94A3B8", border: "#2D4A6A", sigBg: "#1A2C40", sigBorder: "#F1C40F" };
    default:           return { headerBg: "#0F172A", headerText: "#FFFFFF", accent: "#F59E0B", accentSoft: "#F8FAFC", sectionBg: "#F8FAFC", bodyText: "#0F172A", mutedText: "#64748B", border: "#E2E8F0", sigBg: "#F8FAFC", sigBorder: "#F59E0B" };
  }
}

// ── Proposal PDF Component ────────────────────────────────────────────
export function ProposalPdfDocument({ proposal, template = "classic" }: { proposal: ProposalDetail; template?: PdfTemplate }) {
  const co = loadCompanySettings();
  const th = getTheme(template);
  const st = sc(proposal.status);

  const s = StyleSheet.create({
    page:      { fontFamily: R, fontSize: 9, color: th.bodyText, backgroundColor: "#FFFFFF", paddingTop: 0, paddingBottom: 60, paddingHorizontal: 0 },
    // Header band
    hdrBand:   { backgroundColor: th.headerBg, paddingHorizontal: 48, paddingTop: 36, paddingBottom: 28, marginBottom: 32 },
    hdrRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    logoRow:   { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    logoBox:   { width: 28, height: 28, backgroundColor: th.accent, borderRadius: 5, alignItems: "center", justifyContent: "center", marginRight: 8 },
    logoLtr:   { color: "#0F172A", fontSize: 15, fontFamily: B },
    coName:    { fontSize: 16, fontFamily: B, color: th.headerText },
    coDet:     { fontSize: 7, color: th.mutedText, marginTop: 2, lineHeight: 1.5 },
    docLabel:  { fontSize: 28, fontFamily: B, color: th.accent, letterSpacing: 3, textAlign: "right" },
    docSub:    { fontSize: 8, color: th.mutedText, textAlign: "right", marginTop: 4 },
    // Meta row
    metaRow:   { flexDirection: "row", marginTop: 20, gap: 0 },
    metaItem:  { flex: 1, borderTopWidth: 1, borderTopColor: th.accent, paddingTop: 8 },
    metaLbl:   { fontSize: 6.5, fontFamily: B, color: th.accent, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 3 },
    metaVal:   { fontSize: 8, color: th.headerText, fontFamily: B },
    badge:     { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20, borderWidth: 1, alignSelf: "flex-start" },
    badgeTx:   { fontSize: 7, fontFamily: B, textTransform: "uppercase", letterSpacing: 1 },
    // Body
    body:      { paddingHorizontal: 48 },
    // Client card
    cliBand:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 28, backgroundColor: th.sectionBg, borderRadius: 6, padding: 14, borderLeftWidth: 3, borderLeftColor: th.accent },
    cliLbl:    { fontSize: 6.5, fontFamily: B, color: th.accent, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5 },
    cliName:   { fontSize: 13, fontFamily: B, color: th.bodyText },
    cliDet:    { fontSize: 7.5, color: th.mutedText, marginTop: 2 },
    // Sections
    section:   { marginBottom: 22 },
    secHdr:    { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    secBar:    { width: 3, height: 14, backgroundColor: th.accent, borderRadius: 2, marginRight: 8 },
    secLbl:    { fontSize: 10, fontFamily: B, color: th.bodyText, textTransform: "uppercase", letterSpacing: 1.5 },
    secTx:     { fontSize: 8.5, color: th.bodyText, lineHeight: 1.7 },
    secBox:    { backgroundColor: th.sectionBg, borderRadius: 5, padding: 14, borderLeftWidth: 2, borderLeftColor: th.border },
    // Signature
    sigSection:{ marginTop: 32, marginBottom: 20 },
    sigRow:    { flexDirection: "row", gap: 0, marginTop: 10 },
    sigBox:    { flex: 1, marginRight: 16 },
    sigLine:   { borderBottomWidth: 1, borderBottomColor: th.sigBorder, marginBottom: 6, paddingBottom: 18 },
    sigLbl:    { fontSize: 7.5, color: th.mutedText },
    // Footer
    ftr:       { position: "absolute", bottom: 22, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: th.border, paddingTop: 8 },
    ftrTx:     { fontSize: 7, color: th.mutedText },
    ftrBr:     { fontSize: 7, color: th.accent, fontFamily: B },
  });

  const Section = ({ label, text }: { label: string; text: string | null | undefined }) => {
    if (!text?.trim()) return null;
    return (
      <View style={s.section} wrap={false}>
        <View style={s.secHdr}>
          <View style={s.secBar} />
          <Text style={s.secLbl}>{label}</Text>
        </View>
        <View style={s.secBox}>
          <Text style={s.secTx}>{text}</Text>
        </View>
      </View>
    );
  };

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* Header Band */}
        <View style={s.hdrBand} fixed>
          <View style={s.hdrRow}>
            {/* Company */}
            <View>
              <View style={s.logoRow}>
                <View style={s.logoBox}><Text style={s.logoLtr}>{(co.name || "P")[0]}</Text></View>
                <Text style={s.coName}>{co.name}</Text>
              </View>
              {co.address && <Text style={s.coDet}>{co.address}{co.city ? `, ${co.city}` : ""}{co.state ? `, ${co.state}` : ""} {co.zip}</Text>}
              {co.phone && <Text style={s.coDet}>{co.phone}{co.email ? `  ·  ${co.email}` : ""}</Text>}
              {co.license && <Text style={s.coDet}>License #: {co.license}</Text>}
            </View>
            {/* Doc label */}
            <View>
              <Text style={s.docLabel}>PROPOSAL</Text>
              <Text style={s.docSub}>{proposal.proposalNumber}</Text>
            </View>
          </View>

          {/* Meta row */}
          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <Text style={s.metaLbl}>Date</Text>
              <Text style={s.metaVal}>{dt(proposal.createdAt)}</Text>
            </View>
            {proposal.validUntil && (
              <View style={s.metaItem}>
                <Text style={s.metaLbl}>Valid Until</Text>
                <Text style={s.metaVal}>{dt(proposal.validUntil)}</Text>
              </View>
            )}
            <View style={s.metaItem}>
              <Text style={s.metaLbl}>Status</Text>
              <View style={[s.badge, { backgroundColor: st.bg, borderColor: st.bd }]}>
                <Text style={[s.badgeTx, { color: st.tx }]}>{proposal.status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={s.body}>

          {/* Client + Project */}
          <View style={s.cliBand}>
            <View>
              <Text style={s.cliLbl}>Prepared For</Text>
              <Text style={s.cliName}>{proposal.clientName ?? "Client"}</Text>
              <Text style={s.cliDet}>{proposal.projectName}</Text>
            </View>
            <View>
              <Text style={s.cliLbl}>Project</Text>
              <Text style={[s.cliName, { textAlign: "right" }]}>{proposal.projectName}</Text>
            </View>
          </View>

          {/* Text Sections */}
          <Section label="Introduction" text={proposal.introText} />
          <Section label="Scope of Work" text={proposal.scopeOfWork} />
          <Section label="Deliverables" text={proposal.deliverables} />
          <Section label="Timeline" text={proposal.timeline} />
          <Section label="Payment Terms" text={proposal.paymentTerms} />
          <Section label="Terms & Conditions" text={proposal.terms} />

          {/* Signature Block */}
          <View style={s.sigSection} wrap={false}>
            <View style={s.secHdr}>
              <View style={s.secBar} />
              <Text style={s.secLbl}>Acceptance</Text>
            </View>
            <Text style={[s.secTx, { marginBottom: 24 }]}>
              By signing below, you agree to the terms outlined in this proposal and authorize work to commence.
            </Text>
            <View style={s.sigRow}>
              <View style={s.sigBox}>
                <View style={s.sigLine} />
                <Text style={s.sigLbl}>Client Signature</Text>
              </View>
              <View style={s.sigBox}>
                <View style={s.sigLine} />
                <Text style={s.sigLbl}>Print Name</Text>
              </View>
              <View style={s.sigBox}>
                <View style={s.sigLine} />
                <Text style={s.sigLbl}>Date</Text>
              </View>
            </View>
            <View style={[s.sigRow, { marginTop: 24 }]}>
              <View style={s.sigBox}>
                <View style={s.sigLine} />
                <Text style={s.sigLbl}>Authorized Contractor Signature</Text>
              </View>
              <View style={s.sigBox}>
                <View style={s.sigLine} />
                <Text style={s.sigLbl}>Print Name</Text>
              </View>
              <View style={s.sigBox}>
                <View style={s.sigLine} />
                <Text style={s.sigLbl}>Date</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.ftr} fixed>
          <Text style={s.ftrTx}>This proposal is valid for 30 days from the date of issue. Prices subject to change.</Text>
          <Text style={s.ftrBr}>{co.name}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadProposalPdf(proposal: ProposalDetail, template: PdfTemplate = "classic") {
  const blob = await pdf(<ProposalPdfDocument proposal={proposal} template={template} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${proposal.proposalNumber}-${proposal.projectName.replace(/\s+/g, "-")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
