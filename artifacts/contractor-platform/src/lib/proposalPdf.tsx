import { Document, Page, Text, View, StyleSheet, pdf, Image } from "@react-pdf/renderer";
import type { ProposalDetail } from "@/hooks/useProposals";
import { loadCompanySettings, fetchLogoDataUrl } from "@/hooks/useCompanySettings";
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

// ── Markdown parser ───────────────────────────────────────────────────
type MdNode =
  | { kind: "h2"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "para"; text: string };

function stripInline(s: string): string {
  return s
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .trim();
}

function parseMarkdown(raw: string): MdNode[] {
  if (!raw?.trim()) return [];
  const nodes: MdNode[] = [];
  for (const line of raw.split("\n")) {
    const t = line.trimEnd();
    if (!t.trim()) continue;
    if (/^#{1,6}\s+/.test(t)) {
      const text = stripInline(t.replace(/^#{1,6}\s+/, ""));
      if (text) nodes.push({ kind: "h2", text });
    } else if (/^[-*•]\s+/.test(t.trim())) {
      const text = stripInline(t.trim().replace(/^[-*•]\s+/, ""));
      if (text) nodes.push({ kind: "bullet", text });
    } else {
      const text = stripInline(t);
      if (text) nodes.push({ kind: "para", text });
    }
  }
  return nodes;
}

// ── Extract first N headline items for scope overview band ────────────
function extractHighlights(text: string | null | undefined, max = 5): string[] {
  if (!text?.trim()) return [];
  return parseMarkdown(text)
    .filter((n): n is Extract<MdNode, { kind: "h2" | "bullet" }> =>
      n.kind === "h2" || n.kind === "bullet")
    .slice(0, max)
    .map((n) => n.text);
}

// ── Proposal PDF Component ────────────────────────────────────────────
export function ProposalPdfDocument({
  proposal,
  template = "classic",
  logoSrc,
}: {
  proposal: ProposalDetail;
  template?: PdfTemplate;
  logoSrc?: string;
}) {
  const co = loadCompanySettings();
  const th = getTheme(template);

  const s = StyleSheet.create({
    page:         { fontFamily: R, fontSize: 9, color: th.bodyText, backgroundColor: "#FFFFFF", paddingTop: 0, paddingBottom: 60, paddingHorizontal: 0 },
    hdrBand:      { backgroundColor: th.headerBg, paddingHorizontal: 48, paddingTop: 36, paddingBottom: 28, marginBottom: 32 },
    hdrRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    logoRow:      { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    logoBox:      { width: 28, height: 28, backgroundColor: th.accent, borderRadius: 5, alignItems: "center", justifyContent: "center", marginRight: 8 },
    logoLtr:      { color: "#0F172A", fontSize: 15, fontFamily: B },
    logoImg:      { width: 44, height: 44, marginRight: 10, objectFit: "contain" },
    coName:       { fontSize: 16, fontFamily: B, color: th.headerText },
    coDet:        { fontSize: 7, color: th.mutedText, marginTop: 2, lineHeight: 1.5 },
    docLabel:     { fontSize: 28, fontFamily: B, color: th.accent, letterSpacing: 3, textAlign: "right" },
    docSub:       { fontSize: 8, color: th.mutedText, textAlign: "right", marginTop: 4 },
    metaRow:      { flexDirection: "row", marginTop: 20, gap: 0 },
    metaItem:     { flex: 1, borderTopWidth: 1, borderTopColor: th.accent, paddingTop: 8 },
    metaLbl:      { fontSize: 6.5, fontFamily: B, color: th.accent, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 3 },
    metaVal:      { fontSize: 8, color: th.headerText, fontFamily: B },
    body:         { paddingHorizontal: 48 },
    cliBand:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 28, backgroundColor: th.sectionBg, borderRadius: 6, padding: 14, borderLeftWidth: 3, borderLeftColor: th.accent },
    cliLbl:       { fontSize: 6.5, fontFamily: B, color: th.accent, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5 },
    cliName:      { fontSize: 13, fontFamily: B, color: th.bodyText },
    cliDet:       { fontSize: 7.5, color: th.mutedText, marginTop: 2 },
    section:      { marginBottom: 24 },
    secHdr:       { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    secBar:       { width: 3, height: 14, backgroundColor: th.accent, borderRadius: 2, marginRight: 8 },
    secLbl:       { fontSize: 10, fontFamily: B, color: th.bodyText, textTransform: "uppercase", letterSpacing: 1.5 },
    // Compact style for standard terms sections
    termsSec:     { marginBottom: 16 },
    termsHdr:     { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    termsBar:     { width: 2, height: 10, backgroundColor: th.mutedText, borderRadius: 1, marginRight: 6 },
    termsLbl:     { fontSize: 8, fontFamily: B, color: th.mutedText, textTransform: "uppercase", letterSpacing: 1 },
    termsDivider: { borderTopWidth: 1, borderTopColor: th.border, marginBottom: 20, marginTop: 4 },
    termsTitle:   { fontSize: 8, fontFamily: B, color: th.mutedText, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 },
    mdH2:         { fontSize: 9, fontFamily: B, color: th.bodyText, marginTop: 8, marginBottom: 3 },
    mdPara:       { fontSize: 8.5, color: th.bodyText, lineHeight: 1.75, marginBottom: 4 },
    mdBulletRow:  { flexDirection: "row", marginBottom: 3, paddingLeft: 4 },
    mdBulletDot:  { fontSize: 8.5, color: th.accent, marginRight: 7, lineHeight: 1.75, fontFamily: B },
    mdBulletTx:   { fontSize: 8.5, color: th.bodyText, lineHeight: 1.75, flex: 1 },
    // Compact para for terms
    termsPara:    { fontSize: 7.5, color: th.mutedText, lineHeight: 1.7, marginBottom: 3 },
    termsBulletRow: { flexDirection: "row", marginBottom: 2, paddingLeft: 4 },
    termsBulletDot: { fontSize: 7.5, color: th.mutedText, marginRight: 5, lineHeight: 1.7 },
    termsBulletTx:  { fontSize: 7.5, color: th.mutedText, lineHeight: 1.7, flex: 1 },
    overviewBand: { backgroundColor: th.sectionBg, borderRadius: 6, padding: 16, marginBottom: 24, borderLeftWidth: 3, borderLeftColor: th.accent },
    overviewSubs: { fontSize: 8, color: th.mutedText, lineHeight: 1.8 },
    sigSection:   { marginTop: 32, marginBottom: 20 },
    sigRow:       { flexDirection: "row", gap: 0, marginTop: 10 },
    sigBox:       { flex: 1, marginRight: 16 },
    sigLine:      { borderBottomWidth: 1, borderBottomColor: th.sigBorder, marginBottom: 6, paddingBottom: 18 },
    sigLbl:       { fontSize: 7.5, color: th.mutedText },
    ftr:          { position: "absolute", bottom: 22, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: th.border, paddingTop: 8 },
    ftrTx:        { fontSize: 7, color: th.mutedText },
    ftrBr:        { fontSize: 7, color: th.accent, fontFamily: B },
  });

  const RenderMarkdown = ({ nodes }: { nodes: MdNode[] }) => (
    <View>
      {nodes.map((node, i) => {
        if (node.kind === "h2") return <Text key={i} style={s.mdH2}>{node.text}</Text>;
        if (node.kind === "bullet") return (
          <View key={i} style={s.mdBulletRow}>
            <Text style={s.mdBulletDot}>•</Text>
            <Text style={s.mdBulletTx}>{node.text}</Text>
          </View>
        );
        return <Text key={i} style={s.mdPara}>{node.text}</Text>;
      })}
    </View>
  );

  const RenderMarkdownCompact = ({ nodes }: { nodes: MdNode[] }) => (
    <View>
      {nodes.map((node, i) => {
        if (node.kind === "bullet") return (
          <View key={i} style={s.termsBulletRow}>
            <Text style={s.termsBulletDot}>•</Text>
            <Text style={s.termsBulletTx}>{node.text}</Text>
          </View>
        );
        return <Text key={i} style={s.termsPara}>{node.text}</Text>;
      })}
    </View>
  );

  const Section = ({ label, text }: { label: string; text: string | null | undefined }) => {
    if (!text?.trim()) return null;
    const nodes = parseMarkdown(text);
    if (!nodes.length) return null;
    return (
      <View style={s.section} wrap={false}>
        <View style={s.secHdr}>
          <View style={s.secBar} />
          <Text style={s.secLbl}>{label}</Text>
        </View>
        <RenderMarkdown nodes={nodes} />
      </View>
    );
  };

  // Compact rendering for standard terms section
  const TermsItem = ({ label, text }: { label: string; text: string | null | undefined }) => {
    if (!text?.trim()) return null;
    const nodes = parseMarkdown(text);
    if (!nodes.length) return null;
    return (
      <View style={s.termsSec} wrap={false}>
        <View style={s.termsHdr}>
          <View style={s.termsBar} />
          <Text style={s.termsLbl}>{label}</Text>
        </View>
        <RenderMarkdownCompact nodes={nodes} />
      </View>
    );
  };

  // Parse terms visibility config
  function termsVis(key: string): boolean {
    if (!proposal.termsConfig) return true; // legacy: show all
    try {
      const cfg = JSON.parse(proposal.termsConfig) as Record<string, boolean>;
      return cfg[key] !== false;
    } catch { return true; }
  }

  // Only render terms section if enabled and has content
  const TermsSection = ({ termKey, label, text }: { termKey: string; label: string; text: string | null | undefined }) => {
    if (!termsVis(termKey)) return null;
    return <TermsItem label={label} text={text} />;
  };

  // Show terms block only if at least one term is visible and has content
  const hasVisibleTerms = [
    "changeOrders", "siteConditions", "materials", "permits",
    "access", "cleanup", "warranty", "cancellation", "liability"
  ].some(k => termsVis(k) && (proposal as Record<string, unknown>)[k]);

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* Header Band */}
        <View style={s.hdrBand} fixed>
          <View style={s.hdrRow}>
            <View>
              <View style={s.logoRow}>
                {logoSrc
                  ? <Image src={logoSrc} style={s.logoImg} />
                  : <View style={s.logoBox}><Text style={s.logoLtr}>{(co.name || "P")[0]}</Text></View>
                }
                <Text style={s.coName}>{co.name}</Text>
              </View>
              {co.address && <Text style={s.coDet}>{co.address}{co.city ? `, ${co.city}` : ""}{co.state ? `, ${co.state}` : ""} {co.zip}</Text>}
              {co.phone && <Text style={s.coDet}>{co.phone}{co.email ? `  ·  ${co.email}` : ""}</Text>}
              {co.license && <Text style={s.coDet}>License #: {co.license}</Text>}
            </View>
            <View>
              <Text style={s.docLabel}>PROPOSAL</Text>
              <Text style={s.docSub}>{proposal.proposalNumber}</Text>
            </View>
          </View>

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
          </View>
        </View>

        {/* Body */}
        <View style={s.body}>

          {/* Client + Project card */}
          <View style={s.cliBand}>
            <View>
              <Text style={s.cliLbl}>Prepared For</Text>
              <Text style={s.cliName}>{proposal.clientName ?? "Client"}</Text>
            </View>
            <View>
              <Text style={[s.cliLbl, { textAlign: "right" }]}>Project</Text>
              <Text style={[s.cliName, { textAlign: "right" }]}>{proposal.projectName}</Text>
            </View>
          </View>

          {/* ── Project sections ─────────────────────────────── */}
          <Section label="Introduction"          text={proposal.introText} />
          <Section label="Project Overview"      text={proposal.projectOverview} />
          <Section label="Scope of Work"         text={proposal.scopeOfWork} />
          <Section label="Exclusions"            text={proposal.exclusions} />
          <Section label="Allowances & Selections" text={proposal.allowances} />
          <Section label="Deliverables"          text={proposal.deliverables} />
          <Section label="Timeline"              text={proposal.timeline} />
          <Section label="Payment Terms"         text={proposal.paymentTerms} />

          {/* ── Standard Terms (compact, smaller type) ────────── */}
          {hasVisibleTerms && (
            <View wrap={false}>
              <View style={s.termsDivider} />
              <Text style={s.termsTitle}>Terms &amp; Conditions</Text>
              <TermsSection termKey="changeOrders"   label="Change Orders"               text={proposal.changeOrders} />
              <TermsSection termKey="siteConditions" label="Site Conditions"             text={proposal.siteConditions} />
              <TermsSection termKey="materials"      label="Materials & Substitutions"   text={proposal.materials} />
              <TermsSection termKey="permits"        label="Permits, Codes & Approvals"  text={proposal.permits} />
              <TermsSection termKey="access"         label="Access & Jobsite Conditions" text={proposal.access} />
              <TermsSection termKey="cleanup"        label="Cleanup & Disposal"          text={proposal.cleanup} />
              <TermsSection termKey="warranty"       label="Warranty / Guarantee"        text={proposal.warranty} />
              <TermsSection termKey="cancellation"   label="Cancellation / Rescheduling" text={proposal.cancellation} />
              <TermsSection termKey="liability"      label="Limitation of Liability"     text={proposal.liability} />
            </View>
          )}

          {/* Signature Block */}
          <View style={s.sigSection} wrap={false}>
            <View style={s.secHdr}>
              <View style={s.secBar} />
              <Text style={s.secLbl}>Acceptance</Text>
            </View>
            <Text style={[s.mdPara, { marginBottom: 24 }]}>
              By signing below, you acknowledge that you have reviewed and accepted the scope of work, pricing, payment terms, exclusions, and conditions outlined in this proposal.
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
          <Text style={s.ftrTx}>
            {proposal.validUntil
              ? `This proposal expires on ${dt(proposal.validUntil)}. Prices subject to change.`
              : "Prices subject to change."}
          </Text>
          <Text style={s.ftrBr}>{co.name}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadProposalPdf(proposal: ProposalDetail, template: PdfTemplate = "classic") {
  const co = loadCompanySettings();
  const logoSrc = co.logoUrl ? await fetchLogoDataUrl() : undefined;
  const blob = await pdf(<ProposalPdfDocument proposal={proposal} template={template} logoSrc={logoSrc} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${proposal.proposalNumber}-${proposal.projectName.replace(/\s+/g, "-")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
