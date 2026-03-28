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

// ──────────────────────────────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────────────────────────────

const REGULAR = "Helvetica";
const BOLD    = "Helvetica-Bold";
const MONO    = "Courier";

export type PdfTemplate = "classic" | "modern" | "executive";

export const PDF_TEMPLATES: { id: PdfTemplate; label: string; description: string }[] = [
  { id: "classic",   label: "Clásico",   description: "Encabezado oscuro, filas alternas" },
  { id: "modern",    label: "Moderno",   description: "Minimalista, barra lateral dorada" },
  { id: "executive", label: "Ejecutivo", description: "Banner superior, diseño premium" },
];

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
function statusColors(status: string) {
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

// ──────────────────────────────────────────────────────────────────────
// TEMPLATE 1 — CLASSIC
// ──────────────────────────────────────────────────────────────────────
const DARK = "#0F172A";
const GRAY = "#64748B";
const LIGHT = "#F1F5F9";
const BORDER = "#E2E8F0";
const WHITE = "#FFFFFF";
const BRAND = "#F59E0B";

const sc = StyleSheet.create({
  page: { fontFamily: REGULAR, fontSize: 9, color: DARK, backgroundColor: WHITE, paddingTop: 40, paddingBottom: 55, paddingHorizontal: 48 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: DARK },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  logoBox: { width: 30, height: 30, backgroundColor: DARK, borderRadius: 5, alignItems: "center", justifyContent: "center", marginRight: 8 },
  logoLetter: { color: WHITE, fontSize: 17, fontFamily: BOLD },
  companyName: { fontSize: 18, fontFamily: BOLD, color: DARK },
  companyDetail: { fontSize: 7.5, color: GRAY, marginTop: 2 },
  estimateLabel: { fontSize: 26, fontFamily: BOLD, color: "#CBD5E1", letterSpacing: 4, textAlign: "right", marginBottom: 10 },
  metaTable: { alignItems: "flex-end" },
  metaRow: { flexDirection: "row", marginBottom: 3 },
  metaKey: { fontSize: 8, color: GRAY, fontFamily: BOLD, width: 68, textAlign: "right", marginRight: 8 },
  metaVal: { fontSize: 8, color: DARK, fontFamily: BOLD, minWidth: 80 },
  clientSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  sectionLabel: { fontSize: 7, fontFamily: BOLD, color: GRAY, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 },
  clientName: { fontSize: 13, fontFamily: BOLD, color: DARK, marginBottom: 3 },
  clientDetail: { fontSize: 8, color: GRAY, marginTop: 2 },
  projectName: { fontSize: 13, fontFamily: BOLD, color: DARK, textAlign: "right" },
  statusBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 7, fontFamily: BOLD, textTransform: "uppercase", letterSpacing: 1 },
  table: { marginBottom: 20 },
  tableHeader: { flexDirection: "row", backgroundColor: DARK, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 4, marginBottom: 2 },
  thDesc: { flex: 1, color: WHITE, fontSize: 8, fontFamily: BOLD },
  thType: { width: 60, color: WHITE, fontSize: 8, fontFamily: BOLD },
  thQty:  { width: 40, color: WHITE, fontSize: 8, fontFamily: BOLD, textAlign: "center" },
  thRate: { width: 70, color: WHITE, fontSize: 8, fontFamily: BOLD, textAlign: "right" },
  thAmt:  { width: 75, color: WHITE, fontSize: 8, fontFamily: BOLD, textAlign: "right" },
  tableRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  tableRowAlt: { backgroundColor: LIGHT },
  tdDesc: { flex: 1 },
  tdDescMain: { fontSize: 8.5, fontFamily: BOLD, color: DARK },
  tdDescSub: { fontSize: 7, color: GRAY, marginTop: 2 },
  tdType: { width: 60, fontSize: 8, color: GRAY, paddingTop: 1 },
  tdQty:  { width: 40, fontSize: 8, color: GRAY, textAlign: "center", paddingTop: 1 },
  tdRate: { width: 70, fontSize: 8, color: GRAY, textAlign: "right", fontFamily: MONO, paddingTop: 1 },
  tdAmt:  { width: 75, fontSize: 8.5, fontFamily: BOLD, color: DARK, textAlign: "right", paddingTop: 1 },
  noItems: { padding: 16, textAlign: "center", color: GRAY, fontSize: 8 },
  totalsSection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
  totalsBox: { width: 240 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalsRowBorder: { borderTopWidth: 1, borderTopColor: BORDER, marginTop: 4, paddingTop: 8 },
  totalsLabel: { fontSize: 8, color: GRAY },
  totalsVal: { fontSize: 8, color: DARK, fontFamily: MONO },
  totalFinalLabel: { fontSize: 13, fontFamily: BOLD, color: DARK },
  totalFinalVal: { fontSize: 13, fontFamily: MONO, color: DARK },
  notesSection: { marginBottom: 22, padding: 14, backgroundColor: LIGHT, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: BRAND },
  notesLabel: { fontSize: 7, fontFamily: BOLD, color: GRAY, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 },
  notesText: { fontSize: 8, color: "#475569", lineHeight: 1.6 },
  footer: { position: "absolute", bottom: 24, left: 48, right: 48, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerText: { fontSize: 7, color: "#94A3B8" },
  footerBrand: { fontSize: 7, color: BRAND, fontFamily: BOLD },
});

function ClassicDoc({ e }: { e: Estimate }) {
  const company = loadCompanySettings();
  const status = statusColors(e.status);
  const items = e.lineItems ?? [];
  return (
    <Document title={`Estimate ${e.estimateNumber}`} author={company.name}>
      <Page size="LETTER" style={sc.page}>
        <View style={sc.header}>
          <View>
            <View style={sc.logoRow}>
              <View style={sc.logoBox}><Text style={sc.logoLetter}>{company.name.charAt(0).toUpperCase()}</Text></View>
              <Text style={sc.companyName}>{company.name}</Text>
            </View>
            {(company.address || company.city) && (
              <Text style={sc.companyDetail}>{company.address}{company.city ? `, ${company.city}` : ""}{company.state ? `, ${company.state}` : ""}{company.zip ? ` ${company.zip}` : ""}</Text>
            )}
            {(company.phone || company.email) && (
              <Text style={sc.companyDetail}>{company.phone}{company.phone && company.email ? "  ·  " : ""}{company.email}</Text>
            )}
            {company.license && <Text style={sc.companyDetail}>Licencia #: {company.license}</Text>}
          </View>
          <View>
            <Text style={sc.estimateLabel}>ESTIMATE</Text>
            <View style={sc.metaTable}>
              <View style={sc.metaRow}><Text style={sc.metaKey}>Estimate #</Text><Text style={sc.metaVal}>{e.estimateNumber}</Text></View>
              <View style={sc.metaRow}><Text style={sc.metaKey}>Date</Text><Text style={sc.metaVal}>{fmtDate(e.createdAt)}</Text></View>
              {e.validUntil && <View style={sc.metaRow}><Text style={sc.metaKey}>Valid Until</Text><Text style={sc.metaVal}>{fmtDate(e.validUntil)}</Text></View>}
              <View style={[sc.metaRow, { marginTop: 4 }]}>
                <Text style={sc.metaKey}>Status</Text>
                <View style={[sc.statusBadge, { backgroundColor: status.bg, borderColor: status.border }]}>
                  <Text style={[sc.statusText, { color: status.text }]}>{e.status.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={sc.clientSection}>
          <View style={{ width: "48%" }}>
            <Text style={sc.sectionLabel}>Prepared For</Text>
            <Text style={sc.clientName}>{e.clientName ?? "Client"}</Text>
            {e.client?.address && <Text style={sc.clientDetail}>{e.client.address}</Text>}
            {(e.client?.city || e.client?.state) && <Text style={sc.clientDetail}>{e.client.city}{e.client.city && e.client.state ? ", " : ""}{e.client.state} {e.client.zip}</Text>}
            {e.client?.email && <Text style={sc.clientDetail}>{e.client.email}</Text>}
          </View>
          <View style={{ width: "48%", alignItems: "flex-end" }}>
            <Text style={sc.sectionLabel}>Project</Text>
            <Text style={sc.projectName}>{e.projectName}</Text>
          </View>
        </View>

        <View style={sc.table}>
          <View style={sc.tableHeader}>
            <Text style={sc.thDesc}>Description</Text>
            <Text style={sc.thType}>Type</Text>
            <Text style={sc.thQty}>Qty</Text>
            <Text style={sc.thRate}>Unit Price</Text>
            <Text style={sc.thAmt}>Amount</Text>
          </View>
          {items.length === 0 && <Text style={sc.noItems}>No line items.</Text>}
          {items.map((item, idx) => (
            <View key={item.id} style={[sc.tableRow, idx % 2 === 1 ? sc.tableRowAlt : {}]} wrap={false}>
              <View style={sc.tdDesc}>
                <Text style={sc.tdDescMain}>{item.description}</Text>
                {item.category && <Text style={sc.tdDescSub}>{item.category}</Text>}
                {item.supplierName && <Text style={sc.tdDescSub}>Supplier: {item.supplierName}</Text>}
              </View>
              <Text style={sc.tdType}>{item.type}</Text>
              <Text style={sc.tdQty}>{fmtNum(item.quantity)}{item.unit ? ` ${item.unit}` : ""}</Text>
              <Text style={sc.tdRate}>{fmt(item.unitCost)}</Text>
              <Text style={sc.tdAmt}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        <View style={sc.totalsSection}>
          <View style={sc.totalsBox}>
            {e.taxAmount > 0 && (
              <View style={sc.totalsRow}>
                <Text style={sc.totalsLabel}>Tax ({fmtNum(e.taxPercent)}%)</Text>
                <Text style={sc.totalsVal}>+{fmt(e.taxAmount)}</Text>
              </View>
            )}
            <View style={[sc.totalsRow, sc.totalsRowBorder]}>
              <Text style={sc.totalFinalLabel}>Project Total</Text>
              <Text style={sc.totalFinalVal}>{fmt(e.total)}</Text>
            </View>
          </View>
        </View>

        {e.notes && (
          <View style={sc.notesSection}>
            <Text style={sc.notesLabel}>Notes &amp; Terms</Text>
            <Text style={sc.notesText}>{e.notes}</Text>
          </View>
        )}

        <View style={sc.footer} fixed>
          <Text style={sc.footerText}>This estimate is not a contract. Prices may vary based on final material costs.</Text>
          <Text style={sc.footerBrand}>{company.name}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ──────────────────────────────────────────────────────────────────────
// TEMPLATE 2 — MODERN (gold sidebar accent, minimal lines)
// ──────────────────────────────────────────────────────────────────────
const M_ACCENT = "#F59E0B";
const M_DARK   = "#111827";
const M_GRAY   = "#6B7280";
const M_LIGHT  = "#F9FAFB";
const M_BORDER = "#E5E7EB";
const M_WHITE  = "#FFFFFF";

const sm = StyleSheet.create({
  page: { fontFamily: REGULAR, fontSize: 9, color: M_DARK, backgroundColor: M_WHITE, paddingTop: 0, paddingBottom: 55, paddingHorizontal: 0 },

  accentBar: { width: 6, backgroundColor: M_ACCENT, position: "absolute", top: 0, left: 0, bottom: 0 },

  content: { paddingTop: 40, paddingBottom: 55, paddingLeft: 54, paddingRight: 48 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  companyBlock: {},
  companyName: { fontSize: 20, fontFamily: BOLD, color: M_DARK, marginBottom: 4 },
  companyDetail: { fontSize: 7.5, color: M_GRAY, marginTop: 1.5 },

  docLabel: { fontSize: 9, fontFamily: BOLD, color: M_ACCENT, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, textAlign: "right" },
  metaRow: { flexDirection: "row", marginBottom: 3 },
  metaKey: { fontSize: 8, color: M_GRAY, width: 70, textAlign: "right", marginRight: 8 },
  metaVal: { fontSize: 8, color: M_DARK, fontFamily: BOLD },

  divider: { height: 1, backgroundColor: M_ACCENT, marginBottom: 20, opacity: 0.4 },

  clientSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  sectionLabel: { fontSize: 7, fontFamily: BOLD, color: M_ACCENT, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  clientName: { fontSize: 13, fontFamily: BOLD, color: M_DARK, marginBottom: 3 },
  clientDetail: { fontSize: 8, color: M_GRAY, marginTop: 2 },
  projectName: { fontSize: 13, fontFamily: BOLD, color: M_DARK, textAlign: "right" },

  table: { marginBottom: 22 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: M_ACCENT, paddingBottom: 6, marginBottom: 2 },
  th: { fontSize: 7.5, fontFamily: BOLD, color: M_GRAY, textTransform: "uppercase", letterSpacing: 0.5 },
  thDesc: { flex: 1 },
  thType: { width: 60 },
  thQty:  { width: 40, textAlign: "center" },
  thRate: { width: 70, textAlign: "right" },
  thAmt:  { width: 75, textAlign: "right" },

  tableRow: { flexDirection: "row", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: M_BORDER },
  tdDesc: { flex: 1 },
  tdDescMain: { fontSize: 8.5, fontFamily: BOLD, color: M_DARK },
  tdDescSub: { fontSize: 7, color: M_GRAY, marginTop: 2 },
  tdType: { width: 60, fontSize: 8, color: M_GRAY, paddingTop: 1 },
  tdQty:  { width: 40, fontSize: 8, color: M_GRAY, textAlign: "center", paddingTop: 1 },
  tdRate: { width: 70, fontSize: 8, color: M_GRAY, textAlign: "right", fontFamily: MONO, paddingTop: 1 },
  tdAmt:  { width: 75, fontSize: 8.5, fontFamily: BOLD, color: M_DARK, textAlign: "right", paddingTop: 1 },
  noItems: { padding: 16, textAlign: "center", color: M_GRAY, fontSize: 8 },

  totalsSection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 24 },
  totalsBox: { width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalsRowFinal: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 10, borderTopWidth: 2, borderTopColor: M_ACCENT },
  totalsLabel: { fontSize: 8, color: M_GRAY },
  totalsVal: { fontSize: 8, color: M_DARK, fontFamily: MONO },
  totalFinalLabel: { fontSize: 12, fontFamily: BOLD, color: M_DARK },
  totalFinalVal: { fontSize: 12, fontFamily: BOLD, color: M_ACCENT, fontFamily: MONO },

  notesBox: { backgroundColor: M_LIGHT, borderRadius: 4, padding: 14, marginBottom: 20 },
  notesLabel: { fontSize: 7, fontFamily: BOLD, color: M_ACCENT, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 },
  notesText: { fontSize: 8, color: "#4B5563", lineHeight: 1.6 },

  footer: { position: "absolute", bottom: 22, left: 54, right: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerLine: { height: 1, backgroundColor: M_BORDER, marginBottom: 8 },
  footerText: { fontSize: 7, color: "#9CA3AF" },
  footerBrand: { fontSize: 7, color: M_ACCENT, fontFamily: BOLD },
});

function ModernDoc({ e }: { e: Estimate }) {
  const company = loadCompanySettings();
  const items = e.lineItems ?? [];
  return (
    <Document title={`Estimate ${e.estimateNumber}`} author={company.name}>
      <Page size="LETTER" style={sm.page}>
        <View style={sm.accentBar} fixed />
        <View style={sm.content}>

          <View style={sm.header}>
            <View style={sm.companyBlock}>
              <Text style={sm.companyName}>{company.name}</Text>
              {(company.address || company.city) && (
                <Text style={sm.companyDetail}>{company.address}{company.city ? `, ${company.city}` : ""}{company.state ? `, ${company.state}` : ""}{company.zip ? ` ${company.zip}` : ""}</Text>
              )}
              {(company.phone || company.email) && (
                <Text style={sm.companyDetail}>{company.phone}{company.phone && company.email ? "  ·  " : ""}{company.email}</Text>
              )}
              {company.license && <Text style={sm.companyDetail}>Lic. #{company.license}</Text>}
            </View>
            <View>
              <Text style={sm.docLabel}>Estimate</Text>
              <View style={sm.metaRow}><Text style={sm.metaKey}>Número</Text><Text style={sm.metaVal}>{e.estimateNumber}</Text></View>
              <View style={sm.metaRow}><Text style={sm.metaKey}>Fecha</Text><Text style={sm.metaVal}>{fmtDate(e.createdAt)}</Text></View>
              {e.validUntil && <View style={sm.metaRow}><Text style={sm.metaKey}>Válido hasta</Text><Text style={sm.metaVal}>{fmtDate(e.validUntil)}</Text></View>}
            </View>
          </View>

          <View style={sm.divider} />

          <View style={sm.clientSection}>
            <View style={{ width: "48%" }}>
              <Text style={sm.sectionLabel}>Preparado para</Text>
              <Text style={sm.clientName}>{e.clientName ?? "Cliente"}</Text>
              {e.client?.address && <Text style={sm.clientDetail}>{e.client.address}</Text>}
              {(e.client?.city || e.client?.state) && <Text style={sm.clientDetail}>{e.client.city}{e.client.city && e.client.state ? ", " : ""}{e.client.state} {e.client.zip}</Text>}
              {e.client?.email && <Text style={sm.clientDetail}>{e.client.email}</Text>}
            </View>
            <View style={{ width: "48%", alignItems: "flex-end" }}>
              <Text style={sm.sectionLabel}>Proyecto</Text>
              <Text style={sm.projectName}>{e.projectName}</Text>
            </View>
          </View>

          <View style={sm.table}>
            <View style={sm.tableHeader}>
              <Text style={[sm.th, sm.thDesc]}>Descripción</Text>
              <Text style={[sm.th, sm.thType]}>Tipo</Text>
              <Text style={[sm.th, sm.thQty]}>Cant.</Text>
              <Text style={[sm.th, sm.thRate]}>P. Unit.</Text>
              <Text style={[sm.th, sm.thAmt]}>Total</Text>
            </View>
            {items.length === 0 && <Text style={sm.noItems}>Sin partidas.</Text>}
            {items.map((item) => (
              <View key={item.id} style={sm.tableRow} wrap={false}>
                <View style={sm.tdDesc}>
                  <Text style={sm.tdDescMain}>{item.description}</Text>
                  {item.category && <Text style={sm.tdDescSub}>{item.category}</Text>}
                  {item.supplierName && <Text style={sm.tdDescSub}>Proveedor: {item.supplierName}</Text>}
                </View>
                <Text style={sm.tdType}>{item.type}</Text>
                <Text style={sm.tdQty}>{fmtNum(item.quantity)}{item.unit ? ` ${item.unit}` : ""}</Text>
                <Text style={sm.tdRate}>{fmt(item.unitCost)}</Text>
                <Text style={sm.tdAmt}>{fmt(item.total)}</Text>
              </View>
            ))}
          </View>

          <View style={sm.totalsSection}>
            <View style={sm.totalsBox}>
              {e.taxAmount > 0 && (
                <View style={sm.totalsRow}>
                  <Text style={sm.totalsLabel}>Impuesto ({fmtNum(e.taxPercent)}%)</Text>
                  <Text style={sm.totalsVal}>+{fmt(e.taxAmount)}</Text>
                </View>
              )}
              <View style={sm.totalsRowFinal}>
                <Text style={sm.totalFinalLabel}>Total del Proyecto</Text>
                <Text style={sm.totalFinalVal}>{fmt(e.total)}</Text>
              </View>
            </View>
          </View>

          {e.notes && (
            <View style={sm.notesBox}>
              <Text style={sm.notesLabel}>Notas y Términos</Text>
              <Text style={sm.notesText}>{e.notes}</Text>
            </View>
          )}
        </View>

        <View style={sm.footer} fixed>
          <Text style={sm.footerText}>Este estimado no es un contrato. Los precios pueden variar según los costos reales.</Text>
          <Text style={sm.footerBrand}>{company.name}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ──────────────────────────────────────────────────────────────────────
// TEMPLATE 3 — EXECUTIVE (full-width top banner, premium feel)
// ──────────────────────────────────────────────────────────────────────
const E_BG   = "#0F172A";
const E_GOLD = "#F59E0B";
const E_GRAY = "#64748B";
const E_LGRAY = "#F8FAFC";
const E_BORDER = "#E2E8F0";
const E_WHITE = "#FFFFFF";
const E_TEXT  = "#1E293B";

const se = StyleSheet.create({
  page: { fontFamily: REGULAR, fontSize: 9, color: E_TEXT, backgroundColor: E_WHITE, paddingBottom: 60 },

  banner: { backgroundColor: E_BG, paddingTop: 28, paddingBottom: 28, paddingHorizontal: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 0 },
  bannerLeft: {},
  companyName: { fontSize: 22, fontFamily: BOLD, color: E_WHITE, marginBottom: 5 },
  companyDetail: { fontSize: 7.5, color: "#94A3B8", marginTop: 2 },
  bannerRight: { alignItems: "flex-end" },
  docLabel: { fontSize: 28, fontFamily: BOLD, color: E_GOLD, letterSpacing: 3, marginBottom: 8 },
  metaRow: { flexDirection: "row", marginBottom: 3 },
  metaKey: { fontSize: 8, color: "#94A3B8", width: 74, textAlign: "right", marginRight: 8 },
  metaVal: { fontSize: 8, color: E_WHITE, fontFamily: BOLD },

  goldBar: { height: 4, backgroundColor: E_GOLD },

  body: { paddingHorizontal: 48, paddingTop: 28 },

  clientSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: E_BORDER },
  sectionLabel: { fontSize: 7, fontFamily: BOLD, color: E_GOLD, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  clientName: { fontSize: 14, fontFamily: BOLD, color: E_TEXT, marginBottom: 3 },
  clientDetail: { fontSize: 8, color: E_GRAY, marginTop: 2 },
  projectName: { fontSize: 14, fontFamily: BOLD, color: E_TEXT, textAlign: "right" },

  table: { marginBottom: 22 },
  tableHeader: { flexDirection: "row", backgroundColor: E_LGRAY, paddingVertical: 8, paddingHorizontal: 10, borderTopWidth: 2, borderTopColor: E_GOLD, borderBottomWidth: 1, borderBottomColor: E_BORDER },
  th: { fontSize: 7.5, fontFamily: BOLD, color: E_GRAY, textTransform: "uppercase", letterSpacing: 0.5 },
  thDesc: { flex: 1 },
  thType: { width: 60 },
  thQty:  { width: 40, textAlign: "center" },
  thRate: { width: 70, textAlign: "right" },
  thAmt:  { width: 75, textAlign: "right" },

  tableRow: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: E_BORDER },
  tdDesc: { flex: 1 },
  tdDescMain: { fontSize: 8.5, fontFamily: BOLD, color: E_TEXT },
  tdDescSub: { fontSize: 7, color: E_GRAY, marginTop: 2 },
  tdType: { width: 60, fontSize: 8, color: E_GRAY, paddingTop: 1 },
  tdQty:  { width: 40, fontSize: 8, color: E_GRAY, textAlign: "center", paddingTop: 1 },
  tdRate: { width: 70, fontSize: 8, color: E_GRAY, textAlign: "right", fontFamily: MONO, paddingTop: 1 },
  tdAmt:  { width: 75, fontSize: 8.5, fontFamily: BOLD, color: E_TEXT, textAlign: "right", paddingTop: 1 },
  noItems: { padding: 16, textAlign: "center", color: E_GRAY, fontSize: 8 },

  totalsSection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 24 },
  totalsBox: { width: 240, backgroundColor: E_LGRAY, borderRadius: 6, padding: 16 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalsRowFinal: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: E_BORDER },
  totalsLabel: { fontSize: 8, color: E_GRAY },
  totalsVal: { fontSize: 8, color: E_TEXT, fontFamily: MONO },
  totalFinalLabel: { fontSize: 12, fontFamily: BOLD, color: E_TEXT },
  totalFinalVal: { fontSize: 14, fontFamily: BOLD, color: E_BG, fontFamily: MONO },

  notesBox: { borderLeftWidth: 3, borderLeftColor: E_GOLD, paddingLeft: 14, paddingVertical: 10, marginBottom: 20 },
  notesLabel: { fontSize: 7, fontFamily: BOLD, color: E_GOLD, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 },
  notesText: { fontSize: 8, color: E_GRAY, lineHeight: 1.6 },

  footer: { position: "absolute", bottom: 22, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: E_BORDER, paddingTop: 8 },
  footerText: { fontSize: 7, color: "#94A3B8" },
  footerBrand: { fontSize: 7, color: E_GOLD, fontFamily: BOLD },
});

function ExecutiveDoc({ e }: { e: Estimate }) {
  const company = loadCompanySettings();
  const items = e.lineItems ?? [];
  return (
    <Document title={`Estimate ${e.estimateNumber}`} author={company.name}>
      <Page size="LETTER" style={se.page}>
        <View style={se.banner} fixed>
          <View style={se.bannerLeft}>
            <Text style={se.companyName}>{company.name}</Text>
            {(company.address || company.city) && (
              <Text style={se.companyDetail}>{company.address}{company.city ? `, ${company.city}` : ""}{company.state ? `, ${company.state}` : ""}{company.zip ? ` ${company.zip}` : ""}</Text>
            )}
            {(company.phone || company.email) && (
              <Text style={se.companyDetail}>{company.phone}{company.phone && company.email ? "  ·  " : ""}{company.email}</Text>
            )}
            {company.license && <Text style={se.companyDetail}>Lic. #{company.license}</Text>}
          </View>
          <View style={se.bannerRight}>
            <Text style={se.docLabel}>ESTIMATE</Text>
            <View style={se.metaRow}><Text style={se.metaKey}>Número</Text><Text style={se.metaVal}>{e.estimateNumber}</Text></View>
            <View style={se.metaRow}><Text style={se.metaKey}>Fecha</Text><Text style={se.metaVal}>{fmtDate(e.createdAt)}</Text></View>
            {e.validUntil && <View style={se.metaRow}><Text style={se.metaKey}>Válido hasta</Text><Text style={se.metaVal}>{fmtDate(e.validUntil)}</Text></View>}
          </View>
        </View>
        <View style={se.goldBar} />

        <View style={se.body}>
          <View style={se.clientSection}>
            <View style={{ width: "48%" }}>
              <Text style={se.sectionLabel}>Preparado para</Text>
              <Text style={se.clientName}>{e.clientName ?? "Cliente"}</Text>
              {e.client?.address && <Text style={se.clientDetail}>{e.client.address}</Text>}
              {(e.client?.city || e.client?.state) && <Text style={se.clientDetail}>{e.client.city}{e.client.city && e.client.state ? ", " : ""}{e.client.state} {e.client.zip}</Text>}
              {e.client?.email && <Text style={se.clientDetail}>{e.client.email}</Text>}
            </View>
            <View style={{ width: "48%", alignItems: "flex-end" }}>
              <Text style={se.sectionLabel}>Proyecto</Text>
              <Text style={se.projectName}>{e.projectName}</Text>
            </View>
          </View>

          <View style={se.table}>
            <View style={se.tableHeader}>
              <Text style={[se.th, se.thDesc]}>Descripción</Text>
              <Text style={[se.th, se.thType]}>Tipo</Text>
              <Text style={[se.th, se.thQty]}>Cant.</Text>
              <Text style={[se.th, se.thRate]}>P. Unit.</Text>
              <Text style={[se.th, se.thAmt]}>Total</Text>
            </View>
            {items.length === 0 && <Text style={se.noItems}>Sin partidas.</Text>}
            {items.map((item) => (
              <View key={item.id} style={se.tableRow} wrap={false}>
                <View style={se.tdDesc}>
                  <Text style={se.tdDescMain}>{item.description}</Text>
                  {item.category && <Text style={se.tdDescSub}>{item.category}</Text>}
                  {item.supplierName && <Text style={se.tdDescSub}>Proveedor: {item.supplierName}</Text>}
                </View>
                <Text style={se.tdType}>{item.type}</Text>
                <Text style={se.tdQty}>{fmtNum(item.quantity)}{item.unit ? ` ${item.unit}` : ""}</Text>
                <Text style={se.tdRate}>{fmt(item.unitCost)}</Text>
                <Text style={se.tdAmt}>{fmt(item.total)}</Text>
              </View>
            ))}
          </View>

          <View style={se.totalsSection}>
            <View style={se.totalsBox}>
              {e.taxAmount > 0 && (
                <View style={se.totalsRow}>
                  <Text style={se.totalsLabel}>Impuesto ({fmtNum(e.taxPercent)}%)</Text>
                  <Text style={se.totalsVal}>+{fmt(e.taxAmount)}</Text>
                </View>
              )}
              <View style={se.totalsRowFinal}>
                <Text style={se.totalFinalLabel}>Total del Proyecto</Text>
                <Text style={se.totalFinalVal}>{fmt(e.total)}</Text>
              </View>
            </View>
          </View>

          {e.notes && (
            <View style={se.notesBox}>
              <Text style={se.notesLabel}>Notas y Términos</Text>
              <Text style={se.notesText}>{e.notes}</Text>
            </View>
          )}
        </View>

        <View style={se.footer} fixed>
          <Text style={se.footerText}>Este estimado no es un contrato. Los precios pueden variar según los costos reales.</Text>
          <Text style={se.footerBrand}>{company.name}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────

export function EstimatePdfDocument({
  estimate,
  template = "classic",
}: {
  estimate: Estimate;
  template?: PdfTemplate;
}) {
  if (template === "modern")    return <ModernDoc e={estimate} />;
  if (template === "executive") return <ExecutiveDoc e={estimate} />;
  return <ClassicDoc e={estimate} />;
}

export async function downloadEstimatePdf(
  estimate: Estimate,
  template: PdfTemplate = "classic",
) {
  let doc;
  if (template === "modern")    doc = <ModernDoc e={estimate} />;
  else if (template === "executive") doc = <ExecutiveDoc e={estimate} />;
  else doc = <ClassicDoc e={estimate} />;

  const blob = await pdf(doc).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${estimate.estimateNumber} - ${estimate.projectName}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
