import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute } from "wouter";
import { 
  useGetEstimate, 
  useUpdateEstimate, 
  useAddLineItem, 
  useDeleteLineItem,
  useUpdateLineItem,
  useConvertEstimateToInvoice,
  useListMaterials
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Save, Printer, ArrowLeft, Plus, Trash2, CheckCircle, 
  XCircle, Send, FileText, Search, Eye, Download
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { downloadEstimatePdf, EstimatePdfDocument } from "@/lib/estimatePdf";
import { BlobProvider } from "@react-pdf/renderer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function EstimateDetail() {
  const [, params] = useRoute("/estimates/:id");
  const estimateId = params?.id ? parseInt(params.id) : 0;
  
  const { data: estimate, isLoading, refetch } = useGetEstimate(estimateId);
  const updateMutation = useUpdateEstimate();
  const convertMutation = useConvertEstimateToInvoice();
  const { toast } = useToast();

  const [markupPercent, setMarkupPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [notes, setNotes] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Sync local state when estimate loads
  useEffect(() => {
    if (estimate) {
      setMarkupPercent(estimate.markupPercent);
      setTaxPercent(estimate.taxPercent);
      setNotes(estimate.notes || "");
    }
  }, [estimate]);

  const handleSaveSettings = () => {
    updateMutation.mutate({
      id: estimateId,
      data: {
        markupPercent,
        taxPercent,
        notes
      }
    }, {
      onSuccess: () => {
        toast({ title: "Estimate updated successfully" });
        refetch();
      }
    });
  };

  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate({
      id: estimateId,
      data: { status: newStatus }
    }, {
      onSuccess: () => refetch()
    });
  };

  const handlePrint = useCallback(async () => {
    if (!estimate) return;
    setPdfLoading(true);
    try {
      await downloadEstimatePdf(estimate);
    } catch (err) {
      toast({ title: "Error generating PDF", description: String(err), variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  }, [estimate, toast]);

  const handleConvertToInvoice = () => {
    convertMutation.mutate({ id: estimateId }, {
      onSuccess: () => {
        toast({ title: "Converted to invoice successfully" });
        // Typically navigate to invoice here, but we'll just refetch for now
        refetch();
      }
    });
  };

  if (isLoading) return <AppLayout><div className="p-8 text-center text-muted-foreground">Loading...</div></AppLayout>;
  if (!estimate) return <AppLayout><div className="p-8 text-center text-destructive">Estimate not found</div></AppLayout>;

  return (
    <AppLayout>
      {/* ===== APP VIEW (No Print) ===== */}
      <div className="no-print p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/estimates">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border bg-card">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-display font-bold text-foreground">
                  {estimate.projectName}
                </h1>
                <StatusBadge status={estimate.status} />
              </div>
              <p className="text-muted-foreground text-sm font-mono mt-1">
                {estimate.estimateNumber} • {estimate.clientName || 'No Client'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="border-border bg-card" onClick={() => setPreviewOpen(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Vista previa PDF
            </Button>
            <Button variant="outline" className="border-border bg-card" onClick={handlePrint} disabled={pdfLoading}>
              <Download className="w-4 h-4 mr-2" />
              {pdfLoading ? "Generando..." : "Descargar PDF"}
            </Button>
            
            {estimate.status === 'draft' && (
              <Button variant="secondary" onClick={() => handleStatusChange('sent')}>
                <Send className="w-4 h-4 mr-2" /> Mark Sent
              </Button>
            )}
            
            {estimate.status === 'sent' && (
              <>
                <Button variant="outline" className="text-green-500 border-green-500/30 hover:bg-green-500/10" onClick={() => handleStatusChange('approved')}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleStatusChange('rejected')}>
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
              </>
            )}

            {estimate.status === 'approved' && (
              <Button onClick={handleConvertToInvoice} disabled={convertMutation.isPending} className="bg-primary text-primary-foreground shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                <FileText className="w-4 h-4 mr-2" /> 
                {convertMutation.isPending ? "Converting..." : "Convert to Invoice"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content - Line Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/30">
                <h2 className="font-semibold font-display text-lg">Line Items</h2>
                <AddLineItemDialog estimateId={estimateId} onAdd={() => refetch()} />
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-background border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium w-1/3">Description</th>
                      <th className="px-4 py-3 font-medium text-right">Qty</th>
                      <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                      <th className="px-4 py-3 font-medium w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {estimate.lineItems?.map((item) => (
                      <LineItemRow key={item.id} item={item} estimateId={estimateId} onChange={() => refetch()} />
                    ))}
                    {(!estimate.lineItems || estimate.lineItems.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No line items added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-4">
              <h2 className="font-semibold font-display text-lg mb-3">Notes & Terms</h2>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter client notes, scope of work details, or terms and conditions..."
                className="w-full h-32 p-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 text-sm text-foreground resize-none"
              />
              <div className="mt-3 flex justify-end">
                <Button variant="secondary" size="sm" onClick={handleSaveSettings} disabled={updateMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" /> Save Notes
                </Button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Profit & Totals */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-6">
              <h2 className="font-semibold font-display text-lg border-b border-border pb-3">Financials</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Materials Cost</span>
                  <span className="font-mono">{formatCurrency(estimate.materialsCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Labor Cost</span>
                  <span className="font-mono">{formatCurrency(estimate.laborCost)}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-border/50">
                  <span>Subtotal (Base Cost)</span>
                  <span className="font-mono">{formatCurrency(estimate.subtotal)}</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Markup %</label>
                  <div className="relative w-24">
                    <Input 
                      type="number" 
                      value={markupPercent}
                      onChange={(e) => setMarkupPercent(parseFloat(e.target.value) || 0)}
                      onBlur={handleSaveSettings}
                      className="h-8 text-right pr-6 font-mono bg-background"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Tax %</label>
                  <div className="relative w-24">
                    <Input 
                      type="number" 
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      onBlur={handleSaveSettings}
                      className="h-8 text-right pr-6 font-mono bg-background"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Markup Amount</span>
                  <span className="font-mono text-green-500">+{formatCurrency(estimate.markupAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax Amount</span>
                  <span className="font-mono">+{formatCurrency(estimate.taxAmount)}</span>
                </div>
                
                <div className="flex justify-between items-end pt-4 border-t border-border">
                  <span className="text-lg font-bold text-foreground font-display">Grand Total</span>
                  <span className="text-2xl font-bold font-mono text-primary">{formatCurrency(estimate.total)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-border/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-muted-foreground">Expected Profit Margin</span>
                  <span className="text-lg font-bold font-mono text-green-500">{formatNumber(estimate.profitMargin)}%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2 mt-2 border border-border">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, estimate.profitMargin))}%` }}></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ===== PDF PRINT VIEW ===== */}
      <div className="print-area print-only max-w-4xl mx-auto p-12 bg-white text-black min-h-screen">
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded bg-gray-900 flex items-center justify-center">
                <span className="font-bold text-white text-2xl">C</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ProBuilder</h1>
            </div>
            <p className="text-gray-600">123 Construction Way</p>
            <p className="text-gray-600">Building City, ST 12345</p>
            <p className="text-gray-600">(555) 123-4567</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-gray-300 uppercase tracking-widest mb-4">Estimate</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="font-semibold text-gray-600 text-right">Estimate #:</span>
              <span className="font-mono">{estimate.estimateNumber}</span>
              <span className="font-semibold text-gray-600 text-right">Date:</span>
              <span>{formatDate(estimate.createdAt)}</span>
              {estimate.validUntil && (
                <>
                  <span className="font-semibold text-gray-600 text-right">Valid Until:</span>
                  <span>{formatDate(estimate.validUntil)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between mb-12">
          <div className="w-1/2">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Estimate For</h3>
            <p className="font-bold text-xl text-gray-900">{estimate.clientName || 'Client Name'}</p>
            {estimate.client && (
              <div className="mt-1 text-gray-600">
                {estimate.client.address && <p>{estimate.client.address}</p>}
                {(estimate.client.city || estimate.client.state) && (
                  <p>{estimate.client.city}, {estimate.client.state} {estimate.client.zip}</p>
                )}
                {estimate.client.email && <p>{estimate.client.email}</p>}
              </div>
            )}
          </div>
          <div className="w-1/2 text-right">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Project</h3>
            <p className="font-bold text-xl text-gray-900">{estimate.projectName}</p>
          </div>
        </div>

        <table className="w-full mb-12 text-sm border-collapse">
          <thead>
            <tr className="border-y-2 border-gray-300">
              <th className="py-3 px-2 text-left font-bold text-gray-700">Description</th>
              <th className="py-3 px-2 text-center font-bold text-gray-700 w-24">Qty</th>
              <th className="py-3 px-2 text-right font-bold text-gray-700 w-32">Rate</th>
              <th className="py-3 px-2 text-right font-bold text-gray-700 w-32">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {estimate.lineItems?.map((item) => (
              <tr key={item.id} className="group">
                <td className="py-4 px-2">
                  <p className="font-medium text-gray-900">{item.description}</p>
                  {item.category && <p className="text-xs text-gray-500 mt-1">{item.type} • {item.category}</p>}
                </td>
                <td className="py-4 px-2 text-center text-gray-700">
                  {item.quantity} {item.unit || ''}
                </td>
                <td className="py-4 px-2 text-right text-gray-700 font-mono">
                  {formatCurrency(item.unitCost)}
                </td>
                <td className="py-4 px-2 text-right font-medium text-gray-900 font-mono">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-12">
          <div className="w-1/2 max-w-sm">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(estimate.subtotal)}</span>
              </div>
              {estimate.markupAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Markup ({formatNumber(estimate.markupPercent)}%)</span>
                  <span className="font-mono">{formatCurrency(estimate.markupAmount)}</span>
                </div>
              )}
              {estimate.taxAmount > 0 && (
                <div className="flex justify-between text-gray-600 border-b border-gray-200 pb-3">
                  <span>Tax ({formatNumber(estimate.taxPercent)}%)</span>
                  <span className="font-mono">{formatCurrency(estimate.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-gray-900 font-mono">{formatCurrency(estimate.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {estimate.notes && (
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Notes & Terms</h3>
            <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{estimate.notes}</p>
          </div>
        )}
        
        <div className="mt-16 text-center text-xs text-gray-400">
          <p>This is an estimate, not a contract. Prices subject to change based on actual material costs.</p>
        </div>
      </div>

      {/* PDF Preview Sheet */}
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 flex flex-col bg-card border-border"
        >
          <SheetHeader className="px-5 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="font-display text-base">{estimate.projectName}</SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {estimate.estimateNumber} · {estimate.clientName ?? "Sin cliente"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-border mr-6"
                onClick={handlePrint}
                disabled={pdfLoading}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {pdfLoading ? "Generando..." : "Descargar PDF"}
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden bg-muted/30">
            <BlobProvider document={<EstimatePdfDocument estimate={estimate} />}>
              {({ url, loading, error }) => {
                if (loading) return (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground">Renderizando PDF...</p>
                    </div>
                  </div>
                );
                if (error || !url) return (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-destructive">Error al generar la vista previa.</p>
                  </div>
                );
                return (
                  <iframe
                    src={url}
                    className="w-full h-full border-0"
                    title="Vista previa del estimado"
                  />
                );
              }}
            </BlobProvider>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-secondary text-muted-foreground border-border",
    sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
    invoiced: "bg-primary/10 text-primary border-primary/20",
  };
  
  const defaultStyle = "bg-secondary text-muted-foreground border-border";
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status.toLowerCase()] || defaultStyle}`}>
      {status.toUpperCase()}
    </span>
  );
}

// Inline component for editing a row directly
function LineItemRow({ item, estimateId, onChange }: { item: any, estimateId: number, onChange: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [qty, setQty] = useState(item.quantity);
  const [cost, setCost] = useState(item.unitCost);
  const [desc, setDesc] = useState(item.description);
  
  const updateMutation = useUpdateLineItem();
  const deleteMutation = useDeleteLineItem();

  const handleSave = () => {
    updateMutation.mutate({
      id: estimateId,
      lineItemId: item.id,
      data: {
        description: desc,
        quantity: qty,
        unitCost: cost,
      }
    }, {
      onSuccess: () => {
        setIsEditing(false);
        onChange();
      }
    });
  };

  const handleDelete = () => {
    if(confirm("Delete this item?")) {
      deleteMutation.mutate({ id: estimateId, lineItemId: item.id }, {
        onSuccess: () => onChange()
      });
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-secondary/20">
        <td className="px-4 py-2">
          <span className="text-xs uppercase bg-secondary px-2 py-1 rounded text-muted-foreground">{item.type}</span>
        </td>
        <td className="px-4 py-2">
          <Input value={desc} onChange={e => setDesc(e.target.value)} className="h-8 bg-background" />
        </td>
        <td className="px-4 py-2">
          <Input type="number" value={qty} onChange={e => setQty(parseFloat(e.target.value)||0)} className="h-8 w-20 bg-background text-right" />
        </td>
        <td className="px-4 py-2">
          <Input type="number" value={cost} onChange={e => setCost(parseFloat(e.target.value)||0)} className="h-8 w-24 bg-background text-right" />
        </td>
        <td className="px-4 py-2 font-mono text-right text-muted-foreground">
          {formatCurrency(qty * cost)}
        </td>
        <td className="px-4 py-2 text-right space-x-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:bg-green-500/10 hover:text-green-500" onClick={handleSave}>
            <Save className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(false)}>
            <XCircle className="w-4 h-4" />
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-secondary/30 transition-colors group cursor-pointer" onClick={() => setIsEditing(true)}>
      <td className="px-4 py-3">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{item.type}</span>
      </td>
      <td className="px-4 py-3 font-medium text-foreground">{item.description}</td>
      <td className="px-4 py-3 text-right text-muted-foreground">{item.quantity} {item.unit || ''}</td>
      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatCurrency(item.unitCost)}</td>
      <td className="px-4 py-3 text-right font-mono font-medium text-foreground">{formatCurrency(item.total)}</td>
      <td className="px-4 py-3 text-right">
        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}

function AddLineItemDialog({ estimateId, onAdd }: { estimateId: number, onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("material");
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [cost, setCost] = useState<number>(0);
  const [materialId, setMaterialId] = useState<number|null>(null);

  const addMutation = useAddLineItem();
  const { data: materials } = useListMaterials();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!desc) return;
    
    addMutation.mutate({
      id: estimateId,
      data: {
        type,
        description: desc,
        quantity: qty,
        unitCost: cost,
        materialId
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        setDesc(""); setQty(1); setCost(0); setMaterialId(null);
        onAdd();
      }
    });
  };

  const handleMaterialSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    if(isNaN(id)) return;
    
    const mat = materials?.find(m => m.id === id);
    if(mat) {
      setMaterialId(mat.id);
      setDesc(mat.name);
      setCost(mat.currentPrice);
      setType("material");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-8">
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Line Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="material">Material</option>
                <option value="labor">Labor</option>
                <option value="subcontractor">Subcontractor</option>
                <option value="other">Other</option>
              </select>
            </div>
            {type === 'material' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select from Database</label>
                <select onChange={handleMaterialSelect} className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-muted-foreground">
                  <option value="">-- Choose Material --</option>
                  {materials?.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({formatCurrency(m.currentPrice)})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description *</label>
            <Input value={desc} onChange={e => setDesc(e.target.value)} required className="bg-background" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Quantity *</label>
              <Input type="number" step="0.01" value={qty} onChange={e => setQty(parseFloat(e.target.value)||0)} required className="bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Unit Cost *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="number" step="0.01" value={cost} onChange={e => setCost(parseFloat(e.target.value)||0)} required className="pl-8 bg-background" />
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={addMutation.isPending || !desc}>Save Item</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
