import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer";
import type { EstimateDetail } from "@workspace/api-client-react";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2", fontWeight: 700 },
  ],
});

const BRAND = "#F59E0B"; // amber/gold accent
const DARK = "#0F172A";
const GRAY = "#64748B";
const LIGHT_GRAY = "#F1F5F9";
const BORDER = "#E2E8F0";
const WHITE = "#FFFFFF";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9,
    color: DARK,
    backgroundColor: WHITE,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 48,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: DARK,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: DARK,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  logoLetter: {
    color: WHITE,
    fontSize: 18,
    fontWeight: 700,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 700,
    color: DARK,
  },
  companyDetail: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
  },
  estimateLabel: {
    fontSize: 30,
    fontWeight: 700,
    color: "#CBD5E1",
    letterSpacing: 6,
    textAlign: "right",
    marginBottom: 10,
  },
  metaTable: {
    alignItems: "flex-end",
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaKey: {
    fontSize: 8,
    color: GRAY,
    fontWeight: 600,
    width: 70,
    textAlign: "right",
    marginRight: 8,
  },
  metaVal: {
    fontSize: 8,
    color: DARK,
    fontWeight: 600,
    minWidth: 80,
  },

  // ── Client / Project ──
  clientSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 700,
    color: DARK,
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 8,
    color: GRAY,
    marginTop: 1,
  },
  projectName: {
    fontSize: 14,
    fontWeight: 700,
    color: DARK,
    textAlign: "right",
  },

  // ── Line Items Table ──
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: DARK,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 2,
  },
  thDesc: { flex: 1, color: WHITE, fontSize: 8, fontWeight: 600 },
  thType: { width: 60, color: WHITE, fontSize: 8, fontWeight: 600 },
  thQty: { width: 40, color: WHITE, fontSize: 8, fontWeight: 600, textAlign: "center" },
  thRate: { width: 70, color: WHITE, fontSize: 8, fontWeight: 600, textAlign: "right" },
  thAmt: { width: 75, color: WHITE, fontSize: 8, fontWeight: 600, textAlign: "right" },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: LIGHT_GRAY,
  },
  tdDesc: { flex: 1 },
  tdDescMain: { fontSize: 8.5, fontWeight: 600, color: DARK },
  tdDescSub: { fontSize: 7, color: GRAY, marginTop: 2 },
  tdType: { width: 60, fontSize: 8, color: GRAY, textTransform: "capitalize", paddingTop: 1 },
  tdQty: { width: 40, fontSize: 8, color: GRAY, textAlign: "center", paddingTop: 1 },
  tdRate: { width: 70, fontSize: 8, color: GRAY, textAlign: "right", fontFamily: "Courier", paddingTop: 1 },
  tdAmt: { width: 75, fontSize: 8.5, fontWeight: 600, color: DARK, textAlign: "right", fontFamily: "Courier", paddingTop: 1 },

  noItems: {
    padding: 16,
    textAlign: "center",
    color: GRAY,
    fontSize: 8,
  },

  // ── Totals ──
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  totalsBox: {
    width: 240,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsRowBorder: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 4,
    paddingTop: 8,
  },
  totalsLabel: {
    fontSize: 8,
    color: GRAY,
  },
  totalsLabelSub: {
    fontSize: 7.5,
    color: "#94A3B8",
    paddingLeft: 8,
  },
  totalsVal: {
    fontSize: 8,
    color: DARK,
    fontFamily: "Courier",
  },
  totalFinalLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: DARK,
  },
  totalFinalVal: {
    fontSize: 13,
    fontWeight: 700,
    color: DARK,
    fontFamily: "Courier",
  },

  // ── Profit Badge ──
  profitBadge: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  profitBox: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profitLabel: {
    fontSize: 7.5,
    color: "#065F46",
    fontWeight: 600,
  },
  profitVal: {
    fontSize: 12,
    fontWeight: 700,
    color: "#059669",
  },

  // ── Notes ──
  notesSection: {
    marginBottom: 24,
    padding: 14,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: BRAND,
  },
  notesLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 8,
    color: "#475569",
    lineHeight: 1.6,
  },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#94A3B8",
  },
  footerBrand: {
    fontSize: 7,
    color: BRAND,
    fontWeight: 600,
  },

  // ── Status badge ──
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 7,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmtNum(n: number) {
  return n % 1 === 0 ? n.toString() : n.toFixed(2);
}

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return s;
  }
}

function statusColors(status: string) {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    draft:    { bg: "#F8FAFC", border: "#CBD5E1", text: "#64748B" },
    sent:     { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" },
    approved: { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46" },
    rejected: { bg: "#FEF2F2", border: "#FECACA", text: "#DC2626" },
    invoiced: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" },
  };
  return map[status.toLowerCase()] ?? map.draft;
}

type Estimate = NonNullable<EstimateDetail>;

function EstimatePdfDocument({ estimate }: { estimate: Estimate }) {
  const sc = statusColors(estimate.status);
  const items = estimate.lineItems ?? [];

  return (
    <Document title={`Estimate ${estimate.estimateNumber}`} author="ProBuilder">
      <Page size="LETTER" style={styles.page}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoLetter}>C</Text>
              </View>
              <Text style={styles.companyName}>ProBuilder</Text>
            </View>
            <Text style={styles.companyDetail}>123 Construction Way, Building City, ST 12345</Text>
            <Text style={styles.companyDetail}>(555) 123-4567  •  info@probuilder.com</Text>
            <Text style={styles.companyDetail}>License #: GC-2024-001234</Text>
          </View>
          <View>
            <Text style={styles.estimateLabel}>ESTIMATE</Text>
            <View style={styles.metaTable}>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Estimate #</Text>
                <Text style={styles.metaVal}>{estimate.estimateNumber}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Date</Text>
                <Text style={styles.metaVal}>{fmtDate(estimate.createdAt)}</Text>
              </View>
              {estimate.validUntil && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Valid Until</Text>
                  <Text style={styles.metaVal}>{fmtDate(estimate.validUntil)}</Text>
                </View>
              )}
              <View style={[styles.metaRow, { marginTop: 4 }]}>
                <Text style={styles.metaKey}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                  <Text style={[styles.statusText, { color: sc.text }]}>{estimate.status}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── CLIENT / PROJECT ── */}
        <View style={styles.clientSection}>
          <View style={{ width: "48%" }}>
            <Text style={styles.sectionLabel}>Prepared For</Text>
            <Text style={styles.clientName}>{estimate.clientName || "Client"}</Text>
            {estimate.client?.address && <Text style={styles.clientDetail}>{estimate.client.address}</Text>}
            {(estimate.client?.city || estimate.client?.state) && (
              <Text style={styles.clientDetail}>
                {estimate.client.city}{estimate.client.city && estimate.client.state ? ", " : ""}{estimate.client.state} {estimate.client.zip}
              </Text>
            )}
            {estimate.client?.email && <Text style={styles.clientDetail}>{estimate.client.email}</Text>}
            {estimate.client?.phone && <Text style={styles.clientDetail}>{estimate.client.phone}</Text>}
          </View>
          <View style={{ width: "48%", alignItems: "flex-end" }}>
            <Text style={styles.sectionLabel}>Project</Text>
            <Text style={styles.projectName}>{estimate.projectName}</Text>
          </View>
        </View>

        {/* ── LINE ITEMS TABLE ── */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.thDesc}>Description</Text>
            <Text style={styles.thType}>Type</Text>
            <Text style={styles.thQty}>Qty</Text>
            <Text style={styles.thRate}>Rate</Text>
            <Text style={styles.thAmt}>Amount</Text>
          </View>

          {items.length === 0 && (
            <Text style={styles.noItems}>No line items added.</Text>
          )}

          {items.map((item, idx) => (
            <View key={item.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
              <View style={styles.tdDesc}>
                <Text style={styles.tdDescMain}>{item.description}</Text>
                {item.category && <Text style={styles.tdDescSub}>{item.category}</Text>}
                {item.supplierName && <Text style={styles.tdDescSub}>Supplier: {item.supplierName}</Text>}
                {item.notes && <Text style={styles.tdDescSub}>{item.notes}</Text>}
              </View>
              <Text style={styles.tdType}>{item.type}</Text>
              <Text style={styles.tdQty}>{fmtNum(item.quantity)}{item.unit ? ` ${item.unit}` : ""}</Text>
              <Text style={styles.tdRate}>{fmt(item.unitCost)}</Text>
              <Text style={styles.tdAmt}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* ── TOTALS ── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsVal}>{fmt(estimate.subtotal)}</Text>
            </View>
            {estimate.materialsCost > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabelSub}>— Materials</Text>
                <Text style={[styles.totalsVal, { color: GRAY, fontSize: 7.5 }]}>{fmt(estimate.materialsCost)}</Text>
              </View>
            )}
            {estimate.laborCost > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabelSub}>— Labor</Text>
                <Text style={[styles.totalsVal, { color: GRAY, fontSize: 7.5 }]}>{fmt(estimate.laborCost)}</Text>
              </View>
            )}
            {estimate.markupAmount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Markup ({fmtNum(estimate.markupPercent)}%)</Text>
                <Text style={styles.totalsVal}>+{fmt(estimate.markupAmount)}</Text>
              </View>
            )}
            {estimate.taxAmount > 0 && (
              <View style={[styles.totalsRow, { borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 6 }]}>
                <Text style={styles.totalsLabel}>Tax ({fmtNum(estimate.taxPercent)}%)</Text>
                <Text style={styles.totalsVal}>+{fmt(estimate.taxAmount)}</Text>
              </View>
            )}
            <View style={[styles.totalsRow, styles.totalsRowBorder]}>
              <Text style={styles.totalFinalLabel}>Total</Text>
              <Text style={styles.totalFinalVal}>{fmt(estimate.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── PROFIT MARGIN BADGE ── */}
        {estimate.profitMargin > 0 && (
          <View style={styles.profitBadge}>
            <View style={styles.profitBox}>
              <Text style={styles.profitLabel}>Expected Profit Margin</Text>
              <Text style={styles.profitVal}>{fmtNum(estimate.profitMargin)}%</Text>
            </View>
          </View>
        )}

        {/* ── NOTES ── */}
        {estimate.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes & Terms</Text>
            <Text style={styles.notesText}>{estimate.notes}</Text>
          </View>
        )}

        {/* ── FOOTER ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            This is an estimate, not a contract. Prices subject to change based on actual material costs.
          </Text>
          <Text style={styles.footerBrand}>ProBuilder</Text>
        </View>

      </Page>
    </Document>
  );
}

export async function downloadEstimatePdf(estimate: Estimate) {
  const blob = await pdf(<EstimatePdfDocument estimate={estimate} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${estimate.estimateNumber} - ${estimate.projectName}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
