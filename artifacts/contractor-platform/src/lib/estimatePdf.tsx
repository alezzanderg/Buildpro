import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
} from "@react-pdf/renderer";
import type { EstimateDetail } from "@workspace/api-client-react";
import { loadCompanySettings, fetchLogoDataUrl } from "@/hooks/useCompanySettings";

// ── Fonts ──────────────────────────────────────────────────────────────
const R  = "Helvetica";
const B  = "Helvetica-Bold";
const M  = "Courier";

// ── Shared helpers ─────────────────────────────────────────────────────
export type PdfTemplate = "classic" | "modern" | "executive" | "slate" | "minimal" | "blueprint";

export const PDF_TEMPLATES: { id: PdfTemplate; label: string; description: string }[] = [
  { id: "classic",    label: "Classic",    description: "Dark header, alternating rows, gold accent" },
  { id: "modern",     label: "Modern",     description: "Gold sidebar stripe, clean line table" },
  { id: "executive",  label: "Executive",  description: "Full dark banner, premium boxed totals" },
  { id: "slate",      label: "Slate",      description: "Corporate blue-gray, clean two-column layout" },
  { id: "minimal",    label: "Minimal",    description: "Ultra-clean white, thin borders, pure typography" },
  { id: "blueprint",  label: "Blueprint",  description: "Industrial dark theme, technical grid style" },
];

type E = NonNullable<EstimateDetail>;

function $$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function n$(n: number) { return n % 1 === 0 ? String(n) : n.toFixed(2); }
function dt(s: string) {
  try { return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return s; }
}
function sc(status: string) {
  const m: Record<string, { bg: string; bd: string; tx: string }> = {
    draft:    { bg: "#F8FAFC", bd: "#CBD5E1", tx: "#64748B" },
    sent:     { bg: "#EFF6FF", bd: "#BFDBFE", tx: "#1D4ED8" },
    approved: { bg: "#ECFDF5", bd: "#A7F3D0", tx: "#065F46" },
    rejected: { bg: "#FEF2F2", bd: "#FECACA", tx: "#DC2626" },
    invoiced: { bg: "#FFFBEB", bd: "#FDE68A", tx: "#92400E" },
  };
  return m[status?.toLowerCase()] ?? m.draft;
}

// ─────────────────────────────────────────────────────────────────────
// TEMPLATE 1 · CLASSIC
// Dark header, alternating rows, gold accent bar, monospace totals
// ─────────────────────────────────────────────────────────────────────
const s1 = StyleSheet.create({
  page: { fontFamily: R, fontSize: 9, color: "#0F172A", backgroundColor: "#FFFFFF", paddingTop: 40, paddingBottom: 60, paddingHorizontal: 48 },
  hdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: "#0F172A" },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  logoBox: { width: 32, height: 32, backgroundColor: "#0F172A", borderRadius: 6, alignItems: "center", justifyContent: "center", marginRight: 9 },
  logoLtr: { color: "#F59E0B", fontSize: 18, fontFamily: B },
  logoImg: { width: 40, height: 40, marginRight: 10, objectFit: "contain" },
  coName: { fontSize: 19, fontFamily: B, color: "#0F172A" },
  coDet: { fontSize: 7.5, color: "#64748B", marginTop: 2 },
  docLbl: { fontSize: 27, fontFamily: B, color: "#CBD5E1", letterSpacing: 4, textAlign: "right", marginBottom: 10 },
  mTbl: { alignItems: "flex-end" },
  mRow: { flexDirection: "row", marginBottom: 3 },
  mKey: { fontSize: 8, color: "#64748B", fontFamily: B, width: 70, textAlign: "right", marginRight: 8 },
  mVal: { fontSize: 8, color: "#0F172A", fontFamily: B, minWidth: 80 },
  sbadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20, borderWidth: 1 },
  sbadgeTx: { fontSize: 7, fontFamily: B, textTransform: "uppercase", letterSpacing: 1 },
  cli: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  slbl: { fontSize: 7, fontFamily: B, color: "#64748B", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 },
  cliName: { fontSize: 13, fontFamily: B, color: "#0F172A", marginBottom: 3 },
  cliDet: { fontSize: 8, color: "#64748B", marginTop: 2 },
  projName: { fontSize: 13, fontFamily: B, color: "#0F172A", textAlign: "right" },
  tblHdr: { flexDirection: "row", backgroundColor: "#0F172A", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 4, marginBottom: 2 },
  th: { color: "#FFFFFF", fontSize: 8, fontFamily: B },
  thD: { flex: 1 }, thT: { width: 58 }, thQ: { width: 40, textAlign: "center" }, thR: { width: 70, textAlign: "right" }, thA: { width: 75, textAlign: "right" },
  row: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  rowAlt: { backgroundColor: "#F8FAFC" },
  tdD: { flex: 1 }, tdDm: { fontSize: 8.5, fontFamily: B, color: "#0F172A" }, tdDs: { fontSize: 7, color: "#64748B", marginTop: 2 },
  tdT: { width: 58, fontSize: 8, color: "#64748B", paddingTop: 1 },
  tdQ: { width: 40, fontSize: 8, color: "#64748B", textAlign: "center", paddingTop: 1 },
  tdR: { width: 70, fontSize: 8, color: "#64748B", textAlign: "right", fontFamily: M, paddingTop: 1 },
  tdA: { width: 75, fontSize: 8.5, fontFamily: B, color: "#0F172A", textAlign: "right", paddingTop: 1 },
  totSec: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
  totBox: { width: 240 },
  totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totLbl: { fontSize: 8, color: "#64748B" }, totVal: { fontSize: 8, color: "#0F172A", fontFamily: M },
  totFLbl: { fontSize: 13, fontFamily: B, color: "#0F172A" }, totFVal: { fontSize: 13, fontFamily: M, color: "#0F172A" },
  totBdr: { borderTopWidth: 1, borderTopColor: "#E2E8F0", marginTop: 4, paddingTop: 8 },
  notes: { marginBottom: 20, padding: 14, backgroundColor: "#F8FAFC", borderRadius: 6, borderLeftWidth: 3, borderLeftColor: "#F59E0B" },
  notesLbl: { fontSize: 7, fontFamily: B, color: "#64748B", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 },
  notesTx: { fontSize: 8, color: "#475569", lineHeight: 1.6 },
  noItems: { padding: 16, textAlign: "center", color: "#64748B", fontSize: 8 },
  ftr: { position: "absolute", bottom: 24, left: 48, right: 48, borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  ftrTx: { fontSize: 7, color: "#94A3B8" }, ftrBr: { fontSize: 7, color: "#F59E0B", fontFamily: B },
});

function Classic({ e, logoSrc }: { e: E; logoSrc?: string }) {
  const co = loadCompanySettings();
  const st = sc(e.status);
  const items = e.lineItems ?? [];
  return (
    <Document title={`Estimate ${e.estimateNumber}`} author={co.name}>
      <Page size="LETTER" style={s1.page}>
        <View style={s1.hdr}>
          <View>
            <View style={s1.logoRow}>
              {logoSrc
                ? <Image src={logoSrc} style={s1.logoImg} />
                : <View style={s1.logoBox}><Text style={s1.logoLtr}>{co.name.charAt(0).toUpperCase()}</Text></View>
              }
              <Text style={s1.coName}>{co.name}</Text>
            </View>
            {(co.address || co.city) && <Text style={s1.coDet}>{co.address}{co.city ? `, ${co.city}` : ""}{co.state ? `, ${co.state}` : ""}{co.zip ? ` ${co.zip}` : ""}</Text>}
            {(co.phone || co.email) && <Text style={s1.coDet}>{co.phone}{co.phone && co.email ? "  ·  " : ""}{co.email}</Text>}
            {co.license && <Text style={s1.coDet}>License #: {co.license}</Text>}
          </View>
          <View>
            <Text style={s1.docLbl}>ESTIMATE</Text>
            <View style={s1.mTbl}>
              <View style={s1.mRow}><Text style={s1.mKey}>Estimate #</Text><Text style={s1.mVal}>{e.estimateNumber}</Text></View>
              <View style={s1.mRow}><Text style={s1.mKey}>Date</Text><Text style={s1.mVal}>{dt(e.createdAt)}</Text></View>
              {e.validUntil && <View style={s1.mRow}><Text style={s1.mKey}>Valid Until</Text><Text style={s1.mVal}>{dt(e.validUntil)}</Text></View>}
              <View style={[s1.mRow, { marginTop: 4 }]}>
                <Text style={s1.mKey}>Status</Text>
                <View style={[s1.sbadge, { backgroundColor: st.bg, borderColor: st.bd }]}><Text style={[s1.sbadgeTx, { color: st.tx }]}>{e.status.toUpperCase()}</Text></View>
              </View>
            </View>
          </View>
        </View>
        <View style={s1.cli}>
          <View style={{ width: "48%" }}>
            <Text style={s1.slbl}>Prepared For</Text>
            <Text style={s1.cliName}>{e.clientName ?? "Client"}</Text>
            {e.client?.address && <Text style={s1.cliDet}>{e.client.address}</Text>}
            {(e.client?.city || e.client?.state) && <Text style={s1.cliDet}>{e.client.city}{e.client.city && e.client.state ? ", " : ""}{e.client.state} {e.client.zip}</Text>}
            {e.client?.email && <Text style={s1.cliDet}>{e.client.email}</Text>}
          </View>
          <View style={{ width: "48%", alignItems: "flex-end" }}>
            <Text style={s1.slbl}>Project</Text>
            <Text style={s1.projName}>{e.projectName}</Text>
          </View>
        </View>
        <View style={{ marginBottom: 20 }}>
          <View style={s1.tblHdr}>
            <Text style={[s1.th, s1.thD]}>Description</Text>
            <Text style={[s1.th, s1.thT]}>Type</Text>
            <Text style={[s1.th, s1.thQ]}>Qty</Text>
            <Text style={[s1.th, s1.thR]}>Unit Price</Text>
            <Text style={[s1.th, s1.thA]}>Amount</Text>
          </View>
          {items.length === 0 && <Text style={s1.noItems}>No line items.</Text>}
          {items.map((it, i) => (
            <View key={it.id} style={[s1.row, i % 2 === 1 ? s1.rowAlt : {}]} wrap={false}>
              <View style={s1.tdD}><Text style={s1.tdDm}>{it.description}</Text>{it.category && <Text style={s1.tdDs}>{it.category}</Text>}{it.supplierName && <Text style={s1.tdDs}>Supplier: {it.supplierName}</Text>}</View>
              <Text style={s1.tdT}>{it.type}</Text>
              <Text style={s1.tdQ}>{n$(it.quantity)}{it.unit ? ` ${it.unit}` : ""}</Text>
              <Text style={s1.tdR}>{$$(it.unitCost)}</Text>
              <Text style={s1.tdA}>{$$(it.total)}</Text>
            </View>
          ))}
        </View>
        <View style={s1.totSec}>
          <View style={s1.totBox}>
            {e.taxAmount > 0 && <View style={s1.totRow}><Text style={s1.totLbl}>Tax ({n$(e.taxPercent)}%)</Text><Text style={s1.totVal}>+{$$(e.taxAmount)}</Text></View>}
            <View style={[s1.totRow, s1.totBdr]}><Text style={s1.totFLbl}>Project Total</Text><Text style={s1.totFVal}>{$$(e.total)}</Text></View>
          </View>
        </View>
        {e.notes && <View style={s1.notes}><Text style={s1.notesLbl}>Notes & Terms</Text><Text style={s1.notesTx}>{e.notes}</Text></View>}
        <View style={s1.ftr} fixed><Text style={s1.ftrTx}>This estimate is not a contract. Prices may vary based on final material costs.</Text><Text style={s1.ftrBr}>{co.name}</Text></View>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────
// TEMPLATE 2 · MODERN
// Gold left sidebar stripe, serif-feel layout, no alternating rows
// ─────────────────────────────────────────────────────────────────────
const s2 = StyleSheet.create({
  page: { fontFamily: R, fontSize: 9, color: "#111827", backgroundColor: "#FFFFFF", paddingTop: 0, paddingBottom: 60, paddingHorizontal: 0 },
  stripe: { width: 5, backgroundColor: "#F59E0B", position: "absolute", top: 0, left: 0, bottom: 0 },
  body: { paddingTop: 40, paddingBottom: 55, paddingLeft: 52, paddingRight: 48 },
  hdr: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  logoImg: { width: 40, height: 40, marginBottom: 6, objectFit: "contain" },
  coName: { fontSize: 20, fontFamily: B, color: "#111827", marginBottom: 4 },
  coDet: { fontSize: 7.5, color: "#6B7280", marginTop: 2 },
  docLbl: { fontSize: 9, fontFamily: B, color: "#F59E0B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, textAlign: "right" },
  mRow: { flexDirection: "row", marginBottom: 3 },
  mKey: { fontSize: 8, color: "#6B7280", width: 72, textAlign: "right", marginRight: 8 },
  mVal: { fontSize: 8, color: "#111827", fontFamily: B },
  div: { height: 1, backgroundColor: "#F59E0B", marginBottom: 22, opacity: 0.5 },
  cli: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  slbl: { fontSize: 7, fontFamily: B, color: "#F59E0B", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  cliName: { fontSize: 13, fontFamily: B, color: "#111827", marginBottom: 3 },
  cliDet: { fontSize: 8, color: "#6B7280", marginTop: 2 },
  projName: { fontSize: 13, fontFamily: B, color: "#111827", textAlign: "right" },
  tblHdr: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#F59E0B", paddingBottom: 7, marginBottom: 2 },
  th: { fontSize: 7.5, fontFamily: B, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5 },
  thD: { flex: 1 }, thT: { width: 58 }, thQ: { width: 40, textAlign: "center" }, thR: { width: 70, textAlign: "right" }, thA: { width: 75, textAlign: "right" },
  row: { flexDirection: "row", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  tdD: { flex: 1 }, tdDm: { fontSize: 8.5, fontFamily: B, color: "#111827" }, tdDs: { fontSize: 7, color: "#6B7280", marginTop: 2 },
  tdT: { width: 58, fontSize: 8, color: "#6B7280", paddingTop: 1 },
  tdQ: { width: 40, fontSize: 8, color: "#6B7280", textAlign: "center", paddingTop: 1 },
  tdR: { width: 70, fontSize: 8, color: "#6B7280", textAlign: "right", fontFamily: M, paddingTop: 1 },
  tdA: { width: 75, fontSize: 8.5, fontFamily: B, color: "#111827", textAlign: "right", paddingTop: 1 },
  noItems: { padding: 16, textAlign: "center", color: "#6B7280", fontSize: 8 },
  totSec: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16, marginBottom: 24 },
  totBox: { width: 220 },
  totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totFRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTopWidth: 2, borderTopColor: "#F59E0B" },
  totLbl: { fontSize: 8, color: "#6B7280" }, totVal: { fontSize: 8, color: "#111827", fontFamily: M },
  totFLbl: { fontSize: 12, fontFamily: B, color: "#111827" }, totFVal: { fontSize: 12, fontFamily: M, color: "#F59E0B" },
  notes: { backgroundColor: "#F9FAFB", borderRadius: 5, padding: 14, marginBottom: 20 },
  notesLbl: { fontSize: 7, fontFamily: B, color: "#F59E0B", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 },
  notesTx: { fontSize: 8, color: "#4B5563", lineHeight: 1.6 },
  ftr: { position: "absolute", bottom: 22, left: 52, right: 48, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 8 },
  ftrTx: { fontSize: 7, color: "#9CA3AF" }, ftrBr: { fontSize: 7, color: "#F59E0B", fontFamily: B },
});

function Modern({ e, logoSrc }: { e: E; logoSrc?: string }) {
  const co = loadCompanySettings();
  const items = e.lineItems ?? [];
  return (
    <Document title={`Estimate ${e.estimateNumber}`} author={co.name}>
      <Page size="LETTER" style={s2.page}>
        <View style={s2.stripe} fixed />
        <View style={s2.body}>
          <View style={s2.hdr}>
            <View>
              {logoSrc && <Image src={logoSrc} style={s2.logoImg} />}
              <Text style={s2.coName}>{co.name}</Text>
              {(co.address || co.city) && <Text style={s2.coDet}>{co.address}{co.city ? `, ${co.city}` : ""}{co.state ? `, ${co.state}` : ""}{co.zip ? ` ${co.zip}` : ""}</Text>}
              {(co.phone || co.email) && <Text style={s2.coDet}>{co.phone}{co.phone && co.email ? "  ·  " : ""}{co.email}</Text>}
              {co.license && <Text style={s2.coDet}>License #: {co.license}</Text>}
            </View>
            <View>
              <Text style={s2.docLbl}>Estimate</Text>
              <View style={s2.mRow}><Text style={s2.mKey}>Number</Text><Text style={s2.mVal}>{e.estimateNumber}</Text></View>
              <View style={s2.mRow}><Text style={s2.mKey}>Date</Text><Text style={s2.mVal}>{dt(e.createdAt)}</Text></View>
              {e.validUntil && <View style={s2.mRow}><Text style={s2.mKey}>Valid Until</Text><Text style={s2.mVal}>{dt(e.validUntil)}</Text></View>}
            </View>
          </View>
          <View style={s2.div} />
          <View style={s2.cli}>
            <View style={{ width: "48%" }}>
              <Text style={s2.slbl}>Prepared For</Text>
              <Text style={s2.cliName}>{e.clientName ?? "Client"}</Text>
              {e.client?.address && <Text style={s2.cliDet}>{e.client.address}</Text>}
              {(e.client?.city || e.client?.state) && <Text style={s2.cliDet}>{e.client.city}{e.client.city && e.client.state ? ", " : ""}{e.client.state} {e.client.zip}</Text>}
              {e.client?.email && <Text style={s2.cliDet}>{e.client.email}</Text>}
            </View>
            <View style={{ width: "48%", alignItems: "flex-end" }}>
              <Text style={s2.slbl}>Project</Text>
              <Text style={s2.projName}>{e.projectName}</Text>
            </View>
          </View>
          <View style={{ marginBottom: 4 }}>
            <View style={s2.tblHdr}>
              <Text style={[s2.th, s2.thD]}>Description</Text>
              <Text style={[s2.th, s2.thT]}>Type</Text>
              <Text style={[s2.th, s2.thQ]}>Qty</Text>
              <Text style={[s2.th, s2.thR]}>Unit Price</Text>
              <Text style={[s2.th, s2.thA]}>Amount</Text>
            </View>
            {items.length === 0 && <Text style={s2.noItems}>No line items.</Text>}
            {items.map((it) => (
              <View key={it.id} style={s2.row} wrap={false}>
                <View style={s2.tdD}><Text style={s2.tdDm}>{it.description}</Text>{it.category && <Text style={s2.tdDs}>{it.category}</Text>}{it.supplierName && <Text style={s2.tdDs}>Supplier: {it.supplierName}</Text>}</View>
                <Text style={s2.tdT}>{it.type}</Text>
                <Text style={s2.tdQ}>{n$(it.quantity)}{it.unit ? ` ${it.unit}` : ""}</Text>
                <Text style={s2.tdR}>{$$(it.unitCost)}</Text>
                <Text style={s2.tdA}>{$$(it.total)}</Text>
              </View>
            ))}
          </View>
          <View style={s2.totSec}>
            <View style={s2.totBox}>
              {e.taxAmount > 0 && <View style={s2.totRow}><Text style={s2.totLbl}>Tax ({n$(e.taxPercent)}%)</Text><Text style={s2.totVal}>+{$$(e.taxAmount)}</Text></View>}
              <View style={s2.totFRow}><Text style={s2.totFLbl}>Project Total</Text><Text style={s2.totFVal}>{$$(e.total)}</Text></View>
            </View>
          </View>
          {e.notes && <View style={s2.notes}><Text style={s2.notesLbl}>Notes & Terms</Text><Text style={s2.notesTx}>{e.notes}</Text></View>}
        </View>
        <View style={s2.ftr} fixed><Text style={s2.ftrTx}>This estimate is not a contract. Prices may vary based on final material costs.</Text><Text style={s2.ftrBr}>{co.name}</Text></View>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────
// TEMPLATE 3 · EXECUTIVE
// Full dark banner, gold separator bar, boxed totals panel
// ─────────────────────────────────────────────────────────────────────
const s3 = StyleSheet.create({
  page: { fontFamily: R, fontSize: 9, color: "#1E293B", backgroundColor: "#FFFFFF", paddingBottom: 60 },
  banner: { backgroundColor: "#0F172A", paddingTop: 30, paddingBottom: 30, paddingHorizontal: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  logoImg: { width: 40, height: 40, marginBottom: 6, objectFit: "contain" },
  coName: { fontSize: 22, fontFamily: B, color: "#FFFFFF", marginBottom: 5 },
  coDet: { fontSize: 7.5, color: "#94A3B8", marginTop: 2 },
  docLbl: { fontSize: 28, fontFamily: B, color: "#F59E0B", letterSpacing: 3, marginBottom: 8 },
  mRow: { flexDirection: "row", marginBottom: 3 },
  mKey: { fontSize: 8, color: "#94A3B8", width: 76, textAlign: "right", marginRight: 8 },
  mVal: { fontSize: 8, color: "#FFFFFF", fontFamily: B },
  goldBar: { height: 4, backgroundColor: "#F59E0B" },
  body: { paddingHorizontal: 48, paddingTop: 28 },
  cli: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  slbl: { fontSize: 7, fontFamily: B, color: "#F59E0B", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  cliName: { fontSize: 14, fontFamily: B, color: "#1E293B", marginBottom: 3 },
  cliDet: { fontSize: 8, color: "#64748B", marginTop: 2 },
  projName: { fontSize: 14, fontFamily: B, color: "#1E293B", textAlign: "right" },
  tblHdr: { flexDirection: "row", backgroundColor: "#F8FAFC", paddingVertical: 8, paddingHorizontal: 10, borderTopWidth: 2, borderTopColor: "#F59E0B", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  th: { fontSize: 7.5, fontFamily: B, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 },
  thD: { flex: 1 }, thT: { width: 58 }, thQ: { width: 40, textAlign: "center" }, thR: { width: 70, textAlign: "right" }, thA: { width: 75, textAlign: "right" },
  row: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  tdD: { flex: 1 }, tdDm: { fontSize: 8.5, fontFamily: B, color: "#1E293B" }, tdDs: { fontSize: 7, color: "#64748B", marginTop: 2 },
  tdT: { width: 58, fontSize: 8, color: "#64748B", paddingTop: 1 },
  tdQ: { width: 40, fontSize: 8, color: "#64748B", textAlign: "center", paddingTop: 1 },
  tdR: { width: 70, fontSize: 8, color: "#64748B", textAlign: "right", fontFamily: M, paddingTop: 1 },
  tdA: { width: 75, fontSize: 8.5, fontFamily: B, color: "#1E293B", textAlign: "right", paddingTop: 1 },
  noItems: { padding: 16, textAlign: "center", color: "#64748B", fontSize: 8 },
  totSec: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16, marginBottom: 24 },
  totBox: { width: 250, backgroundColor: "#F8FAFC", borderRadius: 8, padding: 18 },
  totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totFRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  totLbl: { fontSize: 8, color: "#64748B" }, totVal: { fontSize: 8, color: "#1E293B", fontFamily: M },
  totFLbl: { fontSize: 12, fontFamily: B, color: "#0F172A" }, totFVal: { fontSize: 14, fontFamily: M, color: "#0F172A" },
  notes: { borderLeftWidth: 3, borderLeftColor: "#F59E0B", paddingLeft: 14, paddingVertical: 10, marginBottom: 20 },
  notesLbl: { fontSize: 7, fontFamily: B, color: "#F59E0B", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 },
  notesTx: { fontSize: 8, color: "#64748B", lineHeight: 1.6 },
  ftr: { position: "absolute", bottom: 22, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 8 },
  ftrTx: { fontSize: 7, color: "#94A3B8" }, ftrBr: { fontSize: 7, color: "#F59E0B", fontFamily: B },
});

function Executive({ e, logoSrc }: { e: E; logoSrc?: string }) {
  const co = loadCompanySettings();
  const items = e.lineItems ?? [];
  return (
    <Document title={`Estimate ${e.estimateNumber}`} author={co.name}>
      <Page size="LETTER" style={s3.page}>
        <View style={s3.banner} fixed>
          <View>{logoSrc && <Image src={logoSrc} style={s3.logoImg} />}<Text style={s3.coName}>{co.name}</Text>{(co.address || co.city) && <Text style={s3.coDet}>{co.address}{co.city ? `, ${co.city}` : ""}{co.state ? `, ${co.state}` : ""}{co.zip ? ` ${co.zip}` : ""}</Text>}{(co.phone || co.email) && <Text style={s3.coDet}>{co.phone}{co.phone && co.email ? "  ·  " : ""}{co.email}</Text>}{co.license && <Text style={s3.coDet}>License #: {co.license}</Text>}</View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s3.docLbl}>ESTIMATE</Text>
            <View style={s3.mRow}><Text style={s3.mKey}>Number</Text><Text style={s3.mVal}>{e.estimateNumber}</Text></View>
            <View style={s3.mRow}><Text style={s3.mKey}>Date</Text><Text style={s3.mVal}>{dt(e.createdAt)}</Text></View>
            {e.validUntil && <View style={s3.mRow}><Text style={s3.mKey}>Valid Until</Text><Text style={s3.mVal}>{dt(e.validUntil)}</Text></View>}
          </View>
        </View>
        <View style={s3.goldBar} />
        <View style={s3.body}>
          <View style={s3.cli}>
            <View style={{ width: "48%" }}><Text style={s3.slbl}>Prepared For</Text><Text style={s3.cliName}>{e.clientName ?? "Client"}</Text>{e.client?.address && <Text style={s3.cliDet}>{e.client.address}</Text>}{(e.client?.city || e.client?.state) && <Text style={s3.cliDet}>{e.client.city}{e.client.city && e.client.state ? ", " : ""}{e.client.state} {e.client.zip}</Text>}{e.client?.email && <Text style={s3.cliDet}>{e.client.email}</Text>}</View>
            <View style={{ width: "48%", alignItems: "flex-end" }}><Text style={s3.slbl}>Project</Text><Text style={s3.projName}>{e.projectName}</Text></View>
          </View>
          <View style={{ marginBottom: 4 }}>
            <View style={s3.tblHdr}><Text style={[s3.th, s3.thD]}>Description</Text><Text style={[s3.th, s3.thT]}>Type</Text><Text style={[s3.th, s3.thQ]}>Qty</Text><Text style={[s3.th, s3.thR]}>Unit Price</Text><Text style={[s3.th, s3.thA]}>Amount</Text></View>
            {items.length === 0 && <Text style={s3.noItems}>No line items.</Text>}
            {items.map((it) => (<View key={it.id} style={s3.row} wrap={false}><View style={s3.tdD}><Text style={s3.tdDm}>{it.description}</Text>{it.category && <Text style={s3.tdDs}>{it.category}</Text>}{it.supplierName && <Text style={s3.tdDs}>Supplier: {it.supplierName}</Text>}</View><Text style={s3.tdT}>{it.type}</Text><Text style={s3.tdQ}>{n$(it.quantity)}{it.unit ? ` ${it.unit}` : ""}</Text><Text style={s3.tdR}>{$$(it.unitCost)}</Text><Text style={s3.tdA}>{$$(it.total)}</Text></View>))}
          </View>
          <View style={s3.totSec}><View style={s3.totBox}>{e.taxAmount > 0 && <View style={s3.totRow}><Text style={s3.totLbl}>Tax ({n$(e.taxPercent)}%)</Text><Text style={s3.totVal}>+{$$(e.taxAmount)}</Text></View>}<View style={s3.totFRow}><Text style={s3.totFLbl}>Project Total</Text><Text style={s3.totFVal}>{$$(e.total)}</Text></View></View></View>
          {e.notes && <View style={s3.notes}><Text style={s3.notesLbl}>Notes & Terms</Text><Text style={s3.notesTx}>{e.notes}</Text></View>}
        </View>
        <View style={s3.ftr} fixed><Text style={s3.ftrTx}>This estimate is not a contract. Prices may vary based on final material costs.</Text><Text style={s3.ftrBr}>{co.name}</Text></View>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────
// TEMPLATE 4 · SLATE
// Corporate blue-gray palette, two-tone header, clean line table
// ─────────────────────────────────────────────────────────────────────
const SL = { ink: "#1E3A5F", mid: "#475569", soft: "#94A3B8", bg: "#F0F4F8", bd: "#D1D9E6", acc: "#2563EB", wh: "#FFFFFF" };
const s4 = StyleSheet.create({
  page: { fontFamily: R, fontSize: 9, color: SL.ink, backgroundColor: SL.wh, paddingTop: 0, paddingBottom: 60 },
  topBar: { backgroundColor: SL.ink, height: 8 },
  body: { paddingHorizontal: 48, paddingTop: 30 },
  hdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30, paddingBottom: 24, borderBottomWidth: 1.5, borderBottomColor: SL.acc },
  logoImg: { width: 40, height: 40, marginBottom: 6, objectFit: "contain" },
  coName: { fontSize: 20, fontFamily: B, color: SL.ink, marginBottom: 4 },
  coDet: { fontSize: 7.5, color: SL.mid, marginTop: 2 },
  docLbl: { fontSize: 24, fontFamily: B, color: SL.acc, letterSpacing: 2, marginBottom: 10, textAlign: "right" },
  mRow: { flexDirection: "row", marginBottom: 3 },
  mKey: { fontSize: 8, color: SL.soft, width: 70, textAlign: "right", marginRight: 8 },
  mVal: { fontSize: 8, color: SL.ink, fontFamily: B },
  cli: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  slbl: { fontSize: 7, fontFamily: B, color: SL.acc, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  cliName: { fontSize: 13, fontFamily: B, color: SL.ink, marginBottom: 3 },
  cliDet: { fontSize: 8, color: SL.mid, marginTop: 2 },
  projName: { fontSize: 13, fontFamily: B, color: SL.ink, textAlign: "right" },
  tblHdr: { flexDirection: "row", backgroundColor: SL.ink, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 3 },
  th: { color: SL.wh, fontSize: 8, fontFamily: B },
  thD: { flex: 1 }, thT: { width: 58 }, thQ: { width: 40, textAlign: "center" }, thR: { width: 70, textAlign: "right" }, thA: { width: 75, textAlign: "right" },
  row: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: SL.bd },
  rowAlt: { backgroundColor: SL.bg },
  tdD: { flex: 1 }, tdDm: { fontSize: 8.5, fontFamily: B, color: SL.ink }, tdDs: { fontSize: 7, color: SL.mid, marginTop: 2 },
  tdT: { width: 58, fontSize: 8, color: SL.mid, paddingTop: 1 },
  tdQ: { width: 40, fontSize: 8, color: SL.mid, textAlign: "center", paddingTop: 1 },
  tdR: { width: 70, fontSize: 8, color: SL.mid, textAlign: "right", fontFamily: M, paddingTop: 1 },
  tdA: { width: 75, fontSize: 8.5, fontFamily: B, color: SL.ink, textAlign: "right", paddingTop: 1 },
  noItems: { padding: 16, textAlign: "center", color: SL.mid, fontSize: 8 },
  totSec: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16, marginBottom: 22 },
  totBox: { width: 240 },
  totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: SL.bd },
  totFRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, paddingBottom: 6, paddingHorizontal: 14, marginTop: 6, backgroundColor: SL.ink, borderRadius: 4 },
  totLbl: { fontSize: 8, color: SL.mid }, totVal: { fontSize: 8, color: SL.ink, fontFamily: M },
  totFLbl: { fontSize: 11, fontFamily: B, color: SL.wh }, totFVal: { fontSize: 12, fontFamily: M, color: "#93C5FD" },
  notes: { backgroundColor: SL.bg, borderRadius: 6, padding: 14, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: SL.acc },
  notesLbl: { fontSize: 7, fontFamily: B, color: SL.acc, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 },
  notesTx: { fontSize: 8, color: SL.mid, lineHeight: 1.6 },
  ftr: { position: "absolute", bottom: 22, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", paddingTop: 8, borderTopWidth: 1, borderTopColor: SL.bd },
  ftrTx: { fontSize: 7, color: SL.soft }, ftrBr: { fontSize: 7, color: SL.acc, fontFamily: B },
});

function Slate({ e, logoSrc }: { e: E; logoSrc?: string }) {
  const co = loadCompanySettings();
  const items = e.lineItems ?? [];
  return (
    <Document title={`Estimate ${e.estimateNumber}`} author={co.name}>
      <Page size="LETTER" style={s4.page}>
        <View style={s4.topBar} fixed />
        <View style={s4.body}>
          <View style={s4.hdr}>
            <View>{logoSrc && <Image src={logoSrc} style={s4.logoImg} />}<Text style={s4.coName}>{co.name}</Text>{(co.address || co.city) && <Text style={s4.coDet}>{co.address}{co.city ? `, ${co.city}` : ""}{co.state ? `, ${co.state}` : ""}{co.zip ? ` ${co.zip}` : ""}</Text>}{(co.phone || co.email) && <Text style={s4.coDet}>{co.phone}{co.phone && co.email ? "  ·  " : ""}{co.email}</Text>}{co.license && <Text style={s4.coDet}>License #: {co.license}</Text>}</View>
            <View>
              <Text style={s4.docLbl}>ESTIMATE</Text>
              <View style={s4.mRow}><Text style={s4.mKey}>Number</Text><Text style={s4.mVal}>{e.estimateNumber}</Text></View>
              <View style={s4.mRow}><Text style={s4.mKey}>Date</Text><Text style={s4.mVal}>{dt(e.createdAt)}</Text></View>
              {e.validUntil && <View style={s4.mRow}><Text style={s4.mKey}>Valid Until</Text><Text style={s4.mVal}>{dt(e.validUntil)}</Text></View>}
            </View>
          </View>
          <View style={s4.cli}>
            <View style={{ width: "48%" }}><Text style={s4.slbl}>Prepared For</Text><Text style={s4.cliName}>{e.clientName ?? "Client"}</Text>{e.client?.address && <Text style={s4.cliDet}>{e.client.address}</Text>}{(e.client?.city || e.client?.state) && <Text style={s4.cliDet}>{e.client.city}{e.client.city && e.client.state ? ", " : ""}{e.client.state} {e.client.zip}</Text>}{e.client?.email && <Text style={s4.cliDet}>{e.client.email}</Text>}</View>
            <View style={{ width: "48%", alignItems: "flex-end" }}><Text style={s4.slbl}>Project</Text><Text style={s4.projName}>{e.projectName}</Text></View>
          </View>
          <View style={{ marginBottom: 4 }}>
            <View style={s4.tblHdr}><Text style={[s4.th, s4.thD]}>Description</Text><Text style={[s4.th, s4.thT]}>Type</Text><Text style={[s4.th, s4.thQ]}>Qty</Text><Text style={[s4.th, s4.thR]}>Unit Price</Text><Text style={[s4.th, s4.thA]}>Amount</Text></View>
            {items.length === 0 && <Text style={s4.noItems}>No line items.</Text>}
            {items.map((it, i) => (<View key={it.id} style={[s4.row, i % 2 === 1 ? s4.rowAlt : {}]} wrap={false}><View style={s4.tdD}><Text style={s4.tdDm}>{it.description}</Text>{it.category && <Text style={s4.tdDs}>{it.category}</Text>}{it.supplierName && <Text style={s4.tdDs}>Supplier: {it.supplierName}</Text>}</View><Text style={s4.tdT}>{it.type}</Text><Text style={s4.tdQ}>{n$(it.quantity)}{it.unit ? ` ${it.unit}` : ""}</Text><Text style={s4.tdR}>{$$(it.unitCost)}</Text><Text style={s4.tdA}>{$$(it.total)}</Text></View>))}
          </View>
          <View style={s4.totSec}><View style={s4.totBox}>{e.taxAmount > 0 && <View style={s4.totRow}><Text style={s4.totLbl}>Tax ({n$(e.taxPercent)}%)</Text><Text style={s4.totVal}>+{$$(e.taxAmount)}</Text></View>}<View style={s4.totFRow}><Text style={s4.totFLbl}>Project Total</Text><Text style={s4.totFVal}>{$$(e.total)}</Text></View></View></View>
          {e.notes && <View style={s4.notes}><Text style={s4.notesLbl}>Notes & Terms</Text><Text style={s4.notesTx}>{e.notes}</Text></View>}
        </View>
        <View style={s4.ftr} fixed><Text style={s4.ftrTx}>This estimate is not a contract. Prices may vary based on final material costs.</Text><Text style={s4.ftrBr}>{co.name}</Text></View>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────
// TEMPLATE 5 · MINIMAL
// Ultra-clean white, fine hairline borders, pure typography
// ─────────────────────────────────────────────────────────────────────
const s5 = StyleSheet.create({
  page: { fontFamily: R, fontSize: 9, color: "#111", backgroundColor: "#FFFFFF", paddingTop: 50, paddingBottom: 64, paddingHorizontal: 52 },
  hdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 },
  logoImg: { width: 40, height: 40, marginBottom: 6, objectFit: "contain" },
  coName: { fontSize: 22, fontFamily: B, color: "#000", letterSpacing: -0.5 },
  coDet: { fontSize: 7.5, color: "#888", marginTop: 3 },
  docLbl: { fontSize: 9, fontFamily: B, color: "#999", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 },
  mRow: { flexDirection: "row", marginBottom: 3 },
  mKey: { fontSize: 8, color: "#AAA", width: 68, textAlign: "right", marginRight: 10 },
  mVal: { fontSize: 8, color: "#333" },
  rule: { height: 1, backgroundColor: "#000", marginBottom: 32 },
  cli: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  slbl: { fontSize: 7, fontFamily: B, color: "#AAA", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
  cliName: { fontSize: 12, fontFamily: B, color: "#111" },
  cliDet: { fontSize: 8, color: "#888", marginTop: 3 },
  projName: { fontSize: 12, fontFamily: B, color: "#111", textAlign: "right" },
  tblHdr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 7, marginBottom: 0 },
  th: { fontSize: 7.5, fontFamily: B, color: "#000", textTransform: "uppercase", letterSpacing: 0.8 },
  thD: { flex: 1 }, thT: { width: 58 }, thQ: { width: 40, textAlign: "center" }, thR: { width: 72, textAlign: "right" }, thA: { width: 78, textAlign: "right" },
  row: { flexDirection: "row", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#EEE" },
  tdD: { flex: 1 }, tdDm: { fontSize: 8.5, color: "#111" }, tdDs: { fontSize: 7, color: "#AAA", marginTop: 2 },
  tdT: { width: 58, fontSize: 8, color: "#888", paddingTop: 1 },
  tdQ: { width: 40, fontSize: 8, color: "#888", textAlign: "center", paddingTop: 1 },
  tdR: { width: 72, fontSize: 8, color: "#888", textAlign: "right", fontFamily: M, paddingTop: 1 },
  tdA: { width: 78, fontSize: 8.5, fontFamily: B, color: "#111", textAlign: "right", paddingTop: 1 },
  noItems: { padding: 16, textAlign: "center", color: "#AAA", fontSize: 8 },
  totSec: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20, marginBottom: 28 },
  totBox: { width: 240 },
  totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#EEE" },
  totFRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12 },
  totLbl: { fontSize: 8, color: "#888" }, totVal: { fontSize: 8, color: "#333", fontFamily: M },
  totFLbl: { fontSize: 14, fontFamily: B, color: "#000" }, totFVal: { fontSize: 14, fontFamily: M, color: "#000" },
  notes: { borderTopWidth: 1, borderTopColor: "#DDD", paddingTop: 16, marginBottom: 20 },
  notesLbl: { fontSize: 7, fontFamily: B, color: "#AAA", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
  notesTx: { fontSize: 8, color: "#555", lineHeight: 1.7 },
  ftr: { position: "absolute", bottom: 26, left: 52, right: 52, flexDirection: "row", justifyContent: "space-between" },
  ftrTx: { fontSize: 7, color: "#CCC" }, ftrBr: { fontSize: 7, color: "#999" },
});

function Minimal({ e, logoSrc }: { e: E; logoSrc?: string }) {
  const co = loadCompanySettings();
  const items = e.lineItems ?? [];
  return (
    <Document title={`Estimate ${e.estimateNumber}`} author={co.name}>
      <Page size="LETTER" style={s5.page}>
        <View style={s5.hdr}>
          <View>{logoSrc && <Image src={logoSrc} style={s5.logoImg} />}<Text style={s5.coName}>{co.name}</Text>{(co.address || co.city) && <Text style={s5.coDet}>{co.address}{co.city ? `, ${co.city}` : ""}{co.state ? `, ${co.state}` : ""}{co.zip ? ` ${co.zip}` : ""}</Text>}{(co.phone || co.email) && <Text style={s5.coDet}>{co.phone}{co.phone && co.email ? "  ·  " : ""}{co.email}</Text>}{co.license && <Text style={s5.coDet}>License #: {co.license}</Text>}</View>
          <View>
            <Text style={s5.docLbl}>Estimate</Text>
            <View style={s5.mRow}><Text style={s5.mKey}>Number</Text><Text style={s5.mVal}>{e.estimateNumber}</Text></View>
            <View style={s5.mRow}><Text style={s5.mKey}>Date</Text><Text style={s5.mVal}>{dt(e.createdAt)}</Text></View>
            {e.validUntil && <View style={s5.mRow}><Text style={s5.mKey}>Valid Until</Text><Text style={s5.mVal}>{dt(e.validUntil)}</Text></View>}
          </View>
        </View>
        <View style={s5.rule} />
        <View style={s5.cli}>
          <View style={{ width: "48%" }}><Text style={s5.slbl}>Prepared For</Text><Text style={s5.cliName}>{e.clientName ?? "Client"}</Text>{e.client?.address && <Text style={s5.cliDet}>{e.client.address}</Text>}{(e.client?.city || e.client?.state) && <Text style={s5.cliDet}>{e.client.city}{e.client.city && e.client.state ? ", " : ""}{e.client.state} {e.client.zip}</Text>}{e.client?.email && <Text style={s5.cliDet}>{e.client.email}</Text>}</View>
          <View style={{ width: "48%", alignItems: "flex-end" }}><Text style={s5.slbl}>Project</Text><Text style={s5.projName}>{e.projectName}</Text></View>
        </View>
        <View>
          <View style={s5.tblHdr}><Text style={[s5.th, s5.thD]}>Description</Text><Text style={[s5.th, s5.thT]}>Type</Text><Text style={[s5.th, s5.thQ]}>Qty</Text><Text style={[s5.th, s5.thR]}>Unit Price</Text><Text style={[s5.th, s5.thA]}>Amount</Text></View>
          {items.length === 0 && <Text style={s5.noItems}>No line items.</Text>}
          {items.map((it) => (<View key={it.id} style={s5.row} wrap={false}><View style={s5.tdD}><Text style={s5.tdDm}>{it.description}</Text>{it.category && <Text style={s5.tdDs}>{it.category}</Text>}{it.supplierName && <Text style={s5.tdDs}>Supplier: {it.supplierName}</Text>}</View><Text style={s5.tdT}>{it.type}</Text><Text style={s5.tdQ}>{n$(it.quantity)}{it.unit ? ` ${it.unit}` : ""}</Text><Text style={s5.tdR}>{$$(it.unitCost)}</Text><Text style={s5.tdA}>{$$(it.total)}</Text></View>))}
        </View>
        <View style={s5.totSec}><View style={s5.totBox}>{e.taxAmount > 0 && <View style={s5.totRow}><Text style={s5.totLbl}>Tax ({n$(e.taxPercent)}%)</Text><Text style={s5.totVal}>+{$$(e.taxAmount)}</Text></View>}<View style={s5.totFRow}><Text style={s5.totFLbl}>Project Total</Text><Text style={s5.totFVal}>{$$(e.total)}</Text></View></View></View>
        {e.notes && <View style={s5.notes}><Text style={s5.notesLbl}>Notes & Terms</Text><Text style={s5.notesTx}>{e.notes}</Text></View>}
        <View style={s5.ftr} fixed><Text style={s5.ftrTx}>This estimate is not a contract. Prices may vary based on final material costs.</Text><Text style={s5.ftrBr}>{co.name}</Text></View>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────
// TEMPLATE 6 · BLUEPRINT
// Dark industrial theme, gold/amber highlights, grid-style structure
// ─────────────────────────────────────────────────────────────────────
const BP = { bg: "#0B1120", panel: "#131C2E", border: "#1E2D45", gold: "#F59E0B", wh: "#FFFFFF", soft: "#94A3B8", mid: "#64748B" };
const s6 = StyleSheet.create({
  page: { fontFamily: R, fontSize: 9, color: BP.wh, backgroundColor: BP.bg, paddingTop: 0, paddingBottom: 60 },
  topBand: { backgroundColor: BP.gold, height: 5 },
  hdrBox: { backgroundColor: BP.panel, paddingTop: 26, paddingBottom: 26, paddingHorizontal: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: BP.border },
  logoImg: { width: 40, height: 40, marginBottom: 6, objectFit: "contain" },
  coName: { fontSize: 20, fontFamily: B, color: BP.wh, marginBottom: 4 },
  coDet: { fontSize: 7.5, color: BP.soft, marginTop: 2 },
  docLbl: { fontSize: 26, fontFamily: B, color: BP.gold, letterSpacing: 3, textAlign: "right", marginBottom: 10 },
  mRow: { flexDirection: "row", marginBottom: 3 },
  mKey: { fontSize: 8, color: BP.mid, width: 72, textAlign: "right", marginRight: 8 },
  mVal: { fontSize: 8, color: BP.wh, fontFamily: B },
  body: { paddingHorizontal: 48, paddingTop: 26 },
  cli: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: BP.border },
  slbl: { fontSize: 7, fontFamily: B, color: BP.gold, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  cliName: { fontSize: 13, fontFamily: B, color: BP.wh, marginBottom: 3 },
  cliDet: { fontSize: 8, color: BP.soft, marginTop: 2 },
  projName: { fontSize: 13, fontFamily: B, color: BP.wh, textAlign: "right" },
  tblHdr: { flexDirection: "row", backgroundColor: BP.gold, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 3 },
  th: { fontSize: 8, fontFamily: B, color: BP.bg },
  thD: { flex: 1 }, thT: { width: 58 }, thQ: { width: 40, textAlign: "center" }, thR: { width: 70, textAlign: "right" }, thA: { width: 75, textAlign: "right" },
  row: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: BP.border },
  rowAlt: { backgroundColor: BP.panel },
  tdD: { flex: 1 }, tdDm: { fontSize: 8.5, fontFamily: B, color: BP.wh }, tdDs: { fontSize: 7, color: BP.soft, marginTop: 2 },
  tdT: { width: 58, fontSize: 8, color: BP.mid, paddingTop: 1 },
  tdQ: { width: 40, fontSize: 8, color: BP.soft, textAlign: "center", paddingTop: 1 },
  tdR: { width: 70, fontSize: 8, color: BP.soft, textAlign: "right", fontFamily: M, paddingTop: 1 },
  tdA: { width: 75, fontSize: 8.5, fontFamily: B, color: BP.gold, textAlign: "right", paddingTop: 1 },
  noItems: { padding: 16, textAlign: "center", color: BP.mid, fontSize: 8 },
  totSec: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16, marginBottom: 24 },
  totBox: { width: 250, backgroundColor: BP.panel, borderWidth: 1, borderColor: BP.border, borderRadius: 6, padding: 16 },
  totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: BP.border },
  totFRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12 },
  totLbl: { fontSize: 8, color: BP.soft }, totVal: { fontSize: 8, color: BP.wh, fontFamily: M },
  totFLbl: { fontSize: 11, fontFamily: B, color: BP.wh }, totFVal: { fontSize: 14, fontFamily: M, color: BP.gold },
  notes: { borderWidth: 1, borderColor: BP.border, borderRadius: 5, padding: 14, marginBottom: 20 },
  notesLbl: { fontSize: 7, fontFamily: B, color: BP.gold, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 },
  notesTx: { fontSize: 8, color: BP.soft, lineHeight: 1.6 },
  ftr: { position: "absolute", bottom: 22, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: BP.border, paddingTop: 8 },
  ftrTx: { fontSize: 7, color: BP.mid }, ftrBr: { fontSize: 7, color: BP.gold, fontFamily: B },
});

function Blueprint({ e, logoSrc }: { e: E; logoSrc?: string }) {
  const co = loadCompanySettings();
  const items = e.lineItems ?? [];
  return (
    <Document title={`Estimate ${e.estimateNumber}`} author={co.name}>
      <Page size="LETTER" style={s6.page}>
        <View style={s6.topBand} fixed />
        <View style={s6.hdrBox} fixed>
          <View>{logoSrc && <Image src={logoSrc} style={s6.logoImg} />}<Text style={s6.coName}>{co.name}</Text>{(co.address || co.city) && <Text style={s6.coDet}>{co.address}{co.city ? `, ${co.city}` : ""}{co.state ? `, ${co.state}` : ""}{co.zip ? ` ${co.zip}` : ""}</Text>}{(co.phone || co.email) && <Text style={s6.coDet}>{co.phone}{co.phone && co.email ? "  ·  " : ""}{co.email}</Text>}{co.license && <Text style={s6.coDet}>License #: {co.license}</Text>}</View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s6.docLbl}>ESTIMATE</Text>
            <View style={s6.mRow}><Text style={s6.mKey}>Number</Text><Text style={s6.mVal}>{e.estimateNumber}</Text></View>
            <View style={s6.mRow}><Text style={s6.mKey}>Date</Text><Text style={s6.mVal}>{dt(e.createdAt)}</Text></View>
            {e.validUntil && <View style={s6.mRow}><Text style={s6.mKey}>Valid Until</Text><Text style={s6.mVal}>{dt(e.validUntil)}</Text></View>}
          </View>
        </View>
        <View style={s6.body}>
          <View style={s6.cli}>
            <View style={{ width: "48%" }}><Text style={s6.slbl}>Prepared For</Text><Text style={s6.cliName}>{e.clientName ?? "Client"}</Text>{e.client?.address && <Text style={s6.cliDet}>{e.client.address}</Text>}{(e.client?.city || e.client?.state) && <Text style={s6.cliDet}>{e.client.city}{e.client.city && e.client.state ? ", " : ""}{e.client.state} {e.client.zip}</Text>}{e.client?.email && <Text style={s6.cliDet}>{e.client.email}</Text>}</View>
            <View style={{ width: "48%", alignItems: "flex-end" }}><Text style={s6.slbl}>Project</Text><Text style={s6.projName}>{e.projectName}</Text></View>
          </View>
          <View style={{ marginBottom: 4 }}>
            <View style={s6.tblHdr}><Text style={[s6.th, s6.thD]}>Description</Text><Text style={[s6.th, s6.thT]}>Type</Text><Text style={[s6.th, s6.thQ]}>Qty</Text><Text style={[s6.th, s6.thR]}>Unit Price</Text><Text style={[s6.th, s6.thA]}>Amount</Text></View>
            {items.length === 0 && <Text style={s6.noItems}>No line items.</Text>}
            {items.map((it, i) => (<View key={it.id} style={[s6.row, i % 2 === 1 ? s6.rowAlt : {}]} wrap={false}><View style={s6.tdD}><Text style={s6.tdDm}>{it.description}</Text>{it.category && <Text style={s6.tdDs}>{it.category}</Text>}{it.supplierName && <Text style={s6.tdDs}>Supplier: {it.supplierName}</Text>}</View><Text style={s6.tdT}>{it.type}</Text><Text style={s6.tdQ}>{n$(it.quantity)}{it.unit ? ` ${it.unit}` : ""}</Text><Text style={s6.tdR}>{$$(it.unitCost)}</Text><Text style={s6.tdA}>{$$(it.total)}</Text></View>))}
          </View>
          <View style={s6.totSec}><View style={s6.totBox}>{e.taxAmount > 0 && <View style={s6.totRow}><Text style={s6.totLbl}>Tax ({n$(e.taxPercent)}%)</Text><Text style={s6.totVal}>+{$$(e.taxAmount)}</Text></View>}<View style={s6.totFRow}><Text style={s6.totFLbl}>Project Total</Text><Text style={s6.totFVal}>{$$(e.total)}</Text></View></View></View>
          {e.notes && <View style={s6.notes}><Text style={s6.notesLbl}>Notes & Terms</Text><Text style={s6.notesTx}>{e.notes}</Text></View>}
        </View>
        <View style={s6.ftr} fixed><Text style={s6.ftrTx}>This estimate is not a contract. Prices may vary based on final material costs.</Text><Text style={s6.ftrBr}>{co.name}</Text></View>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────
function buildDoc(e: E, template: PdfTemplate, logoSrc?: string) {
  switch (template) {
    case "modern":     return <Modern     e={e} logoSrc={logoSrc} />;
    case "executive":  return <Executive  e={e} logoSrc={logoSrc} />;
    case "slate":      return <Slate      e={e} logoSrc={logoSrc} />;
    case "minimal":    return <Minimal    e={e} logoSrc={logoSrc} />;
    case "blueprint":  return <Blueprint  e={e} logoSrc={logoSrc} />;
    default:           return <Classic    e={e} logoSrc={logoSrc} />;
  }
}

export function EstimatePdfDocument({
  estimate,
  template = "classic",
  logoSrc,
}: {
  estimate: E;
  template?: PdfTemplate;
  logoSrc?: string;
}) {
  return buildDoc(estimate, template, logoSrc);
}

export async function downloadEstimatePdf(
  estimate: E,
  template: PdfTemplate = "classic",
) {
  const logoSrc = await fetchLogoDataUrl();
  const blob = await pdf(buildDoc(estimate, template, logoSrc ?? undefined)).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${estimate.estimateNumber} - ${estimate.projectName}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
