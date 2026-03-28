import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { EstimateDetail } from "@workspace/api-client-react";
import { loadCompanySettings } from "@/hooks/useCompanySettings";

const BRAND = "#F59E0B";
const DARK = "#0F172A";
const GRAY = "#64748B";
const LIGHT_GRAY = "#F1F5F9";
const BORDER = "#E2E8F0";
const WHITE = "#FFFFFF";

const REGULAR = "Helvetica";
const BOLD = "Helvetica-Bold";
const MONO = "Courier";

const s = StyleSheet.create({
  page: {
    fontFamily: REGULAR,
    fontSize: 9,
    color: DARK,
    backgroundColor: WHITE,
    paddingTop: 40,
    paddingBottom: 55,
    paddingHorizontal: 48,
  },

  // ── Header ──────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: DARK,
  },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  logoBox: {
    width: 30,
    height: 30,
    backgroundColor: DARK,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  logoLetter: { color: WHITE, fontSize: 17, fontFamily: BOLD },
  companyName: { fontSize: 18, fontFamily: BOLD, color: DARK },
  companyDetail: { fontSize: 7.5, color: GRAY, marginTop: 2 },

  estimateLabel: {
    fontSize: 26,
    fontFamily: BOLD,
    color: "#CBD5E1",
    letterSpacing: 4,
    textAlign: "right",
    marginBottom: 10,
  },
  metaTable: { alignItems: "flex-end" },
  metaRow: { flexDirection: "row", marginBottom: 3 },
  metaKey: { fontSize: 8, color: GRAY, fontFamily: BOLD, width: 68, textAlign: "right", marginRight: 8 },
  metaVal: { fontSize: 8, color: DARK, fontFamily: BOLD, minWidth: 80 },

  // ── Client / Project ─────────────────────────────────
  clientSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  sectionLabel: {
    fontSize: 7,
    fontFamily: BOLD,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  clientName: { fontSize: 13, fontFamily: BOLD, color: DARK, marginBottom: 3 },
  clientDetail: { fontSize: 8, color: GRAY, marginTop: 2 },
  projectName: { fontSize: 13, fontFamily: BOLD, color: DARK, textAlign: "right" },

  // ── Status badge ─────────────────────────────────────
  statusBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 7, fontFamily: BOLD, textTransform: "uppercase", letterSpacing: 1 },

  // ── Table ────────────────────────────────────────────
  table: { marginBottom: 20 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: DARK,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 2,
  },
  thDesc: { flex: 1, color: WHITE, fontSize: 8, fontFamily: BOLD },
  thType: { width: 60, color: WHITE, fontSize: 8, fontFamily: BOLD },
  thQty:  { width: 40, color: WHITE, fontSize: 8, fontFamily: BOLD, textAlign: "center" },
  thRate: { width: 70, color: WHITE, fontSize: 8, fontFamily: BOLD, textAlign: "right" },
  thAmt:  { width: 75, color: WHITE, fontSize: 8, fontFamily: BOLD, textAlign: "right" },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowAlt: { backgroundColor: LIGHT_GRAY },

  tdDesc: { flex: 1 },
  tdDescMain: { fontSize: 8.5, fontFamily: BOLD, color: DARK },
  tdDescSub:  { fontSize: 7, color: GRAY, marginTop: 2 },
  tdType: { width: 60, fontSize: 8, color: GRAY, paddingTop: 1 },
  tdQty:  { width: 40, fontSize: 8, color: GRAY, textAlign: "center", paddingTop: 1 },
  tdRate: { width: 70, fontSize: 8, color: GRAY, textAlign: "right", fontFamily: MONO, paddingTop: 1 },
  tdAmt:  { width: 75, fontSize: 8.5, fontFamily: BOLD, color: DARK, textAlign: "right", paddingTop: 1 },

  noItems: { padding: 16, textAlign: "center", color: GRAY, fontSize: 8 },

  // ── Totals ───────────────────────────────────────────
  totalsSection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
  totalsBox: { width: 240 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalsRowBorder: { borderTopWidth: 1, borderTopColor: BORDER, marginTop: 4, paddingTop: 8 },
  totalsLabel:    { fontSize: 8, color: GRAY },
  totalsLabelSub: { fontSize: 7.5, color: "#94A3B8", paddingLeft: 8 },
  totalsVal:      { fontSize: 8, color: DARK, fontFamily: MONO },
  totalFinalLabel: { fontSize: 13, fontFamily: BOLD, color: DARK },
  totalFinalVal:   { fontSize: 13, fontFamily: MONO, color: DARK },

  // ── Profit Badge ─────────────────────────────────────
  profitBadge: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 18 },
  profitBox: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  profitLabel: { fontSize: 7.5, color: "#065F46", fontFamily: BOLD, marginRight: 10 },
  profitVal:   { fontSize: 12, fontFamily: BOLD, color: "#059669" },

  // ── Notes ────────────────────────────────────────────
  notesSection: {
    marginBottom: 22,
    padding: 14,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: BRAND,
  },
  notesLabel: { fontSize: 7, fontFamily: BOLD, color: GRAY, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 },
  notesText:  { fontSize: 8, color: "#475569", lineHeight: 1.6 },

  // ── Footer ───────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText:  { fontSize: 7, color: "#94A3B8" },
  footerBrand: { fontSize: 7, color: BRAND, fontFamily: BOLD },
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function fmtNum(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}
function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return s;
  }
}
function statusStyle(status: string): { bg: string; border: string; text: string } {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    draft:    { bg: "#F8FAFC", border: "#CBD5E1", text: "#64748B" },
    sent:     { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" },
    approved: { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46" },
    rejected: { bg: "#FEF2F2", border: "#FECACA", text: "#DC2626" },
    invoiced: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" },
  };
  return map[status?.toLowerCase()] ?? map.draft;
}

type Estimate = NonNullable<EstimateDetail>;

export function EstimatePdfDocument({ estimate }: { estimate: Estimate }) {
  return <PdfDoc e={estimate} />;
}

function PdfDoc({ e }: { e: Estimate }) {
  const company = loadCompanySettings();
  const sc = statusStyle(e.status);
  const items = e.lineItems ?? [];

  return (
    <Document title={`Estimate ${e.estimateNumber}`} author={company.name}>
      <Page size="LETTER" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <View>
            <View style={s.logoRow}>
              <View style={s.logoBox}>
                <Text style={s.logoLetter}>{company.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={s.companyName}>{company.name}</Text>
            </View>
            {(company.address || company.city) && (
              <Text style={s.companyDetail}>
                {company.address}
                {company.city ? `, ${company.city}` : ""}
                {company.state ? `, ${company.state}` : ""}
                {company.zip ? ` ${company.zip}` : ""}
              </Text>
            )}
            {(company.phone || company.email) && (
              <Text style={s.companyDetail}>
                {company.phone}{company.phone && company.email ? "  ·  " : ""}{company.email}
              </Text>
            )}
            {company.license && (
              <Text style={s.companyDetail}>Licencia #: {company.license}</Text>
            )}
          </View>
          <View>
            <Text style={s.estimateLabel}>ESTIMATE</Text>
            <View style={s.metaTable}>
              <View style={s.metaRow}>
                <Text style={s.metaKey}>Estimate #</Text>
                <Text style={s.metaVal}>{e.estimateNumber}</Text>
              </View>
              <View style={s.metaRow}>
                <Text style={s.metaKey}>Date</Text>
                <Text style={s.metaVal}>{fmtDate(e.createdAt)}</Text>
              </View>
              {e.validUntil && (
                <View style={s.metaRow}>
                  <Text style={s.metaKey}>Valid Until</Text>
                  <Text style={s.metaVal}>{fmtDate(e.validUntil)}</Text>
                </View>
              )}
              <View style={[s.metaRow, { marginTop: 4 }]}>
                <Text style={s.metaKey}>Status</Text>
                <View style={[s.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                  <Text style={[s.statusText, { color: sc.text }]}>{e.status.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* CLIENT / PROJECT */}
        <View style={s.clientSection}>
          <View style={{ width: "48%" }}>
            <Text style={s.sectionLabel}>Prepared For</Text>
            <Text style={s.clientName}>{e.clientName ?? "Client"}</Text>
            {e.client?.address && <Text style={s.clientDetail}>{e.client.address}</Text>}
            {(e.client?.city || e.client?.state) && (
              <Text style={s.clientDetail}>
                {e.client.city}{e.client.city && e.client.state ? ", " : ""}{e.client.state} {e.client.zip}
              </Text>
            )}
            {e.client?.email && <Text style={s.clientDetail}>{e.client.email}</Text>}
            {e.client?.phone && <Text style={s.clientDetail}>{e.client.phone}</Text>}
          </View>
          <View style={{ width: "48%", alignItems: "flex-end" }}>
            <Text style={s.sectionLabel}>Project</Text>
            <Text style={s.projectName}>{e.projectName}</Text>
          </View>
        </View>

        {/* TABLE */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={s.thDesc}>Description</Text>
            <Text style={s.thType}>Type</Text>
            <Text style={s.thQty}>Qty</Text>
            <Text style={s.thRate}>Unit Price</Text>
            <Text style={s.thAmt}>Amount</Text>
          </View>

          {items.length === 0 && <Text style={s.noItems}>No line items.</Text>}

          {items.map((item, idx) => (
            <View key={item.id} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]} wrap={false}>
              <View style={s.tdDesc}>
                <Text style={s.tdDescMain}>{item.description}</Text>
                {item.category    && <Text style={s.tdDescSub}>{item.category}</Text>}
                {item.supplierName && <Text style={s.tdDescSub}>Supplier: {item.supplierName}</Text>}
                {item.notes       && <Text style={s.tdDescSub}>{item.notes}</Text>}
              </View>
              <Text style={s.tdType}>{item.type}</Text>
              <Text style={s.tdQty}>{fmtNum(item.quantity)}{item.unit ? ` ${item.unit}` : ""}</Text>
              <Text style={s.tdRate}>{fmt(item.unitCost)}</Text>
              <Text style={s.tdAmt}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* TOTALS */}
        <View style={s.totalsSection}>
          <View style={s.totalsBox}>
            {e.taxAmount > 0 && (
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>Tax ({fmtNum(e.taxPercent)}%)</Text>
                <Text style={s.totalsVal}>+{fmt(e.taxAmount)}</Text>
              </View>
            )}
            <View style={[s.totalsRow, s.totalsRowBorder]}>
              <Text style={s.totalFinalLabel}>Project Total</Text>
              <Text style={s.totalFinalVal}>{fmt(e.total)}</Text>
            </View>
          </View>
        </View>

        {/* NOTES */}
        {e.notes && (
          <View style={s.notesSection}>
            <Text style={s.notesLabel}>Notes &amp; Terms</Text>
            <Text style={s.notesText}>{e.notes}</Text>
          </View>
        )}

        {/* FOOTER */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            This estimate is not a contract. Prices may vary based on final material costs.
          </Text>
          <Text style={s.footerBrand}>{company.name}</Text>
        </View>

      </Page>
    </Document>
  );
}

export async function downloadEstimatePdf(estimate: Estimate) {
  const blob = await pdf(<PdfDoc e={estimate} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${estimate.estimateNumber} - ${estimate.projectName}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
