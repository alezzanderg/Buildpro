import { useEffect } from "react";
import { useRoute } from "wouter";
import { useGetEstimate } from "@workspace/api-client-react";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";

const printStyles = `
  @media print {
    .no-print { display: none !important; }
    body { background: white !important; }
    @page { margin: 0.5in; }
  }
  body { background: white; margin: 0; }
`;

export default function EstimatePrint() {
  const [, params] = useRoute("/estimates/:id/print");
  const estimateId = params?.id ? parseInt(params.id) : 0;

  const { data: estimate, isLoading } = useGetEstimate(estimateId);

  useEffect(() => {
    if (estimate) {
      document.title = `Estimate ${estimate.estimateNumber} - ${estimate.projectName}`;
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
  }, [estimate]);

  if (isLoading) {
    return (
      <>
        <style>{printStyles}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "white" }}>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>Preparing estimate for printing...</p>
        </div>
      </>
    );
  }

  if (!estimate) {
    return (
      <>
        <style>{printStyles}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "white" }}>
          <p style={{ color: "#ef4444", fontSize: "14px" }}>Estimate not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{printStyles}</style>
    <div style={{ backgroundColor: "white", color: "black", minHeight: "100vh", padding: "48px", maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #1a1a1a", paddingBottom: "32px", marginBottom: "32px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: "bold", fontSize: "20px" }}>C</span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#111", margin: 0 }}>ProBuilder</h1>
          </div>
          <p style={{ color: "#555", margin: "2px 0", fontSize: "14px" }}>123 Construction Way</p>
          <p style={{ color: "#555", margin: "2px 0", fontSize: "14px" }}>Building City, ST 12345</p>
          <p style={{ color: "#555", margin: "2px 0", fontSize: "14px" }}>(555) 123-4567</p>
          <p style={{ color: "#555", margin: "2px 0", fontSize: "14px" }}>info@probuilder.com</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ fontSize: "40px", fontWeight: "bold", color: "#d1d5db", textTransform: "uppercase", letterSpacing: "6px", margin: "0 0 16px 0" }}>ESTIMATE</h2>
          <table style={{ marginLeft: "auto", borderCollapse: "collapse", fontSize: "14px" }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: "600", color: "#6b7280", paddingRight: "12px", paddingBottom: "4px", textAlign: "right" }}>Estimate #:</td>
                <td style={{ fontFamily: "monospace", fontWeight: "600", paddingBottom: "4px" }}>{estimate.estimateNumber}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "600", color: "#6b7280", paddingRight: "12px", paddingBottom: "4px", textAlign: "right" }}>Date:</td>
                <td style={{ paddingBottom: "4px" }}>{formatDate(estimate.createdAt)}</td>
              </tr>
              {estimate.validUntil && (
                <tr>
                  <td style={{ fontWeight: "600", color: "#6b7280", paddingRight: "12px", paddingBottom: "4px", textAlign: "right" }}>Valid Until:</td>
                  <td style={{ paddingBottom: "4px" }}>{formatDate(estimate.validUntil)}</td>
                </tr>
              )}
              <tr>
                <td style={{ fontWeight: "600", color: "#6b7280", paddingRight: "12px", textAlign: "right" }}>Status:</td>
                <td style={{ fontWeight: "600", textTransform: "uppercase" }}>{estimate.status}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Client & Project */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
        <div style={{ width: "48%" }}>
          <p style={{ fontSize: "11px", fontWeight: "bold", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>Prepared For</p>
          <p style={{ fontSize: "20px", fontWeight: "bold", color: "#111", margin: "0 0 4px 0" }}>{estimate.clientName || "Client Name"}</p>
          {estimate.client && (
            <div style={{ color: "#555", fontSize: "14px" }}>
              {estimate.client.address && <p style={{ margin: "2px 0" }}>{estimate.client.address}</p>}
              {(estimate.client.city || estimate.client.state) && (
                <p style={{ margin: "2px 0" }}>{estimate.client.city}{estimate.client.city && estimate.client.state ? ", " : ""}{estimate.client.state} {estimate.client.zip}</p>
              )}
              {estimate.client.email && <p style={{ margin: "2px 0" }}>{estimate.client.email}</p>}
              {estimate.client.phone && <p style={{ margin: "2px 0" }}>{estimate.client.phone}</p>}
            </div>
          )}
        </div>
        <div style={{ width: "48%", textAlign: "right" }}>
          <p style={{ fontSize: "11px", fontWeight: "bold", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>Project</p>
          <p style={{ fontSize: "20px", fontWeight: "bold", color: "#111", margin: 0 }}>{estimate.projectName}</p>
        </div>
      </div>

      {/* Line Items Table */}
      <table style={{ width: "100%", marginBottom: "40px", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ borderTop: "2px solid #e5e7eb", borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: "700", color: "#374151" }}>Description</th>
            <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: "700", color: "#374151", width: "80px" }}>Type</th>
            <th style={{ padding: "12px 8px", textAlign: "center", fontWeight: "700", color: "#374151", width: "80px" }}>Qty</th>
            <th style={{ padding: "12px 8px", textAlign: "right", fontWeight: "700", color: "#374151", width: "100px" }}>Rate</th>
            <th style={{ padding: "12px 8px", textAlign: "right", fontWeight: "700", color: "#374151", width: "110px" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {estimate.lineItems?.map((item, idx) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: idx % 2 === 0 ? "white" : "#fafafa" }}>
              <td style={{ padding: "12px 8px" }}>
                <p style={{ fontWeight: "500", color: "#111", margin: 0 }}>{item.description}</p>
                {item.category && <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0 0" }}>{item.category}</p>}
                {item.supplierName && <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0 0" }}>Supplier: {item.supplierName}</p>}
              </td>
              <td style={{ padding: "12px 8px", color: "#6b7280", fontSize: "12px", textTransform: "capitalize" }}>{item.type}</td>
              <td style={{ padding: "12px 8px", textAlign: "center", color: "#555" }}>
                {item.quantity} {item.unit || ""}
              </td>
              <td style={{ padding: "12px 8px", textAlign: "right", color: "#555", fontFamily: "monospace" }}>
                {formatCurrency(item.unitCost)}
              </td>
              <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: "600", color: "#111", fontFamily: "monospace" }}>
                {formatCurrency(item.total)}
              </td>
            </tr>
          ))}
          {(!estimate.lineItems || estimate.lineItems.length === 0) && (
            <tr>
              <td colSpan={5} style={{ padding: "24px 8px", textAlign: "center", color: "#9ca3af" }}>No line items</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "40px" }}>
        <div style={{ width: "280px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#555", fontSize: "14px" }}>
            <span>Subtotal</span>
            <span style={{ fontFamily: "monospace" }}>{formatCurrency(estimate.subtotal)}</span>
          </div>
          {estimate.materialsCost > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#9ca3af", fontSize: "13px" }}>
              <span>— Materials</span>
              <span style={{ fontFamily: "monospace" }}>{formatCurrency(estimate.materialsCost)}</span>
            </div>
          )}
          {estimate.laborCost > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#9ca3af", fontSize: "13px" }}>
              <span>— Labor</span>
              <span style={{ fontFamily: "monospace" }}>{formatCurrency(estimate.laborCost)}</span>
            </div>
          )}
          {estimate.markupAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#555", fontSize: "14px" }}>
              <span>Markup ({formatNumber(estimate.markupPercent)}%)</span>
              <span style={{ fontFamily: "monospace" }}>+{formatCurrency(estimate.markupAmount)}</span>
            </div>
          )}
          {estimate.taxAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#555", fontSize: "14px", borderBottom: "1px solid #e5e7eb", paddingBottom: "10px" }}>
              <span>Tax ({formatNumber(estimate.taxPercent)}%)</span>
              <span style={{ fontFamily: "monospace" }}>+{formatCurrency(estimate.taxAmount)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 0 0" }}>
            <span style={{ fontSize: "20px", fontWeight: "bold", color: "#111" }}>Total</span>
            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#111", fontFamily: "monospace" }}>{formatCurrency(estimate.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {estimate.notes && (
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "32px", marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", fontWeight: "bold", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px" }}>Notes & Terms</p>
          <p style={{ color: "#555", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{estimate.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "20px", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "#9ca3af" }}>
          This is an estimate, not a contract. Prices subject to change based on actual material costs. Valid for 30 days from date of issue.
        </p>
      </div>

      {/* Print button - hidden when printing */}
      <div className="no-print" style={{ position: "fixed", bottom: "24px", right: "24px", display: "flex", gap: "8px" }}>
        <button
          onClick={() => window.print()}
          style={{ backgroundColor: "#111", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
        >
          🖨 Print / Save PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{ backgroundColor: "#f3f4f6", color: "#333", border: "1px solid #e5e7eb", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
        >
          ✕ Close
        </button>
      </div>
    </div>
    </>
  );
}
