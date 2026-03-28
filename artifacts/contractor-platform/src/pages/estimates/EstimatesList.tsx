import { useState } from "react";
import { useListEstimates, useCreateEstimate, useListClients, useCreateClient, useGetEstimate } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, formatDate } from "@/lib/format";
import { Link, useLocation } from "wouter";
import { Plus, Search, Filter, Eye, ArrowRight, UserPlus, X, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BlobProvider } from "@react-pdf/renderer";
import { EstimatePdfDocument, downloadEstimatePdf, PDF_TEMPLATES, type PdfTemplate } from "@/lib/estimatePdf";

export default function EstimatesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [previewId, setPreviewId] = useState<number | null>(null);
  const { data: estimates, isLoading } = useListEstimates();
  const [, navigate] = useLocation();

  const filteredEstimates = estimates?.filter(e => 
    e.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.estimateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.clientName && e.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Estimates</h1>
            <p className="text-muted-foreground mt-1">Manage and track your project estimates.</p>
          </div>
          <CreateEstimateDialog onSuccess={(id) => navigate(`/estimates/${id}`)} />
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between bg-card/50">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search estimates..." 
                className="pl-9 bg-background border-border focus-visible:ring-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="border-border hover:bg-secondary">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50 border-b border-border text-sm text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Estimate #</th>
                  <th className="px-6 py-4 font-medium">Project Name</th>
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Total</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4"></div>
                        Loading estimates...
                      </div>
                    </td>
                  </tr>
                ) : filteredEstimates?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium text-foreground">No estimates found</p>
                      <p className="text-sm mt-1">Create your first estimate to get started.</p>
                    </td>
                  </tr>
                ) : (
                  filteredEstimates?.map((est) => (
                    <tr key={est.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                        {est.estimateNumber}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {est.projectName}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {est.clientName || '—'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {formatDate(est.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-right text-foreground">
                        {formatCurrency(est.total)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={est.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            title="PDF Preview"
                            onClick={() => setPreviewId(est.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Link href={`/estimates/${est.id}`}>
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                              Ver <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <EstimatePreviewSheet
        estimateId={previewId}
        onClose={() => setPreviewId(null)}
      />
    </AppLayout>
  );
}

function EstimatePreviewSheet({
  estimateId,
  onClose,
}: {
  estimateId: number | null;
  onClose: () => void;
}) {
  const [template, setTemplate] = useState<PdfTemplate>("classic");
  const { data: estimate, isLoading } = useGetEstimate(
    estimateId ?? 0,
    { query: { enabled: estimateId !== null } }
  );

  return (
    <Sheet open={estimateId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col bg-card border-border"
      >
        <SheetHeader className="px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="font-display text-base">
                {estimate?.projectName ?? "Preview"}
              </SheetTitle>
              {estimate && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {estimate.estimateNumber} · {estimate.clientName ?? "No client"}
                </p>
              )}
            </div>
            {estimate && (
              <Button
                size="sm"
                variant="outline"
                className="border-border mr-6"
                onClick={() => downloadEstimatePdf(estimate, template)}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download PDF
              </Button>
            )}
          </div>

          {/* Template selector */}
          <div className="flex gap-2 mt-3">
            {PDF_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                title={t.description}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  template === t.id
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(250,204,21,0.25)]"
                    : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden bg-muted/30">
          {isLoading || !estimate ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Loading preview...</p>
              </div>
            </div>
          ) : (
            <BlobProvider document={<EstimatePdfDocument estimate={estimate} template={template} />}>
              {({ url, loading, error }) => {
                if (loading) return (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground">Rendering PDF...</p>
                    </div>
                  </div>
                );
                if (error || !url) return (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-destructive">Error generating preview.</p>
                  </div>
                );
                return (
                  <iframe
                    src={url}
                    className="w-full h-full border-0"
                    title="Estimate Preview"
                  />
                );
              }}
            </BlobProvider>
          )}
        </div>
      </SheetContent>
    </Sheet>
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

function CreateEstimateDialog({ onSuccess }: { onSuccess: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [clientId, setClientId] = useState<number | "">("");

  // Inline new-client form
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  const { data: clients, refetch: refetchClients } = useListClients();
  const createMutation = useCreateEstimate();
  const createClientMutation = useCreateClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) return;
    createMutation.mutate(
      { data: { projectName, clientId: clientId === "" ? null : clientId, status: "draft" } },
      { onSuccess: (data) => { setOpen(false); onSuccess(data.id); } }
    );
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    createClientMutation.mutate(
      { data: { name: newClientName, email: newClientEmail || null, phone: newClientPhone || null } },
      {
        onSuccess: (newClient) => {
          refetchClients();
          setClientId(newClient.id);
          setShowNewClient(false);
          setNewClientName("");
          setNewClientEmail("");
          setNewClientPhone("");
        },
      }
    );
  };

  const cancelNewClient = () => {
    setShowNewClient(false);
    setNewClientName("");
    setNewClientEmail("");
    setNewClientPhone("");
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setProjectName("");
      setClientId("");
      setShowNewClient(false);
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPhone("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
          <Plus className="w-4 h-4 mr-2" />
          New Estimate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display">Create New Estimate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">

          {/* Project name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Project Name *</label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Kitchen Remodel - Smith Residence"
              className="bg-background border-border"
              autoFocus
              required
            />
          </div>

          {/* Client selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Cliente (Opcional)</label>
              {!showNewClient && (
                <button
                  type="button"
                  onClick={() => setShowNewClient(true)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  New client
                </button>
              )}
            </div>

            {!showNewClient && (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : "")}
                className="w-full h-10 px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              >
                <option value="">Select client...</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {/* Inline new client form */}
            {showNewClient && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">New Client</span>
                  <button
                    type="button"
                    onClick={cancelNewClient}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Name *</label>
                  <Input
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Full name or company"
                    className="bg-background border-border h-9 text-sm"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="email@ejemplo.com"
                      className="bg-background border-border h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Phone</label>
                    <Input
                      type="tel"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="(555) 000-0000"
                      className="bg-background border-border h-9 text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-primary text-primary-foreground"
                  disabled={!newClientName.trim() || createClientMutation.isPending}
                  onClick={handleCreateClient}
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  {createClientMutation.isPending ? "Saving..." : "Save & select"}
                </Button>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !projectName}>
              {createMutation.isPending ? "Creating..." : "Create & Continue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
