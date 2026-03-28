import { useState } from "react";
import { useListEstimates, useCreateEstimate, useListClients } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, formatDate } from "@/lib/format";
import { Link, useLocation } from "wouter";
import { Plus, Search, Filter, MoreHorizontal, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function EstimatesList() {
  const [searchTerm, setSearchTerm] = useState("");
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
                        <Link href={`/estimates/${est.id}`}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary hover:bg-primary/10">
                            View <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
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

function CreateEstimateDialog({ onSuccess }: { onSuccess: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [clientId, setClientId] = useState<number | "">("");
  
  const { data: clients } = useListClients();
  const createMutation = useCreateEstimate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) return;
    
    createMutation.mutate({
      data: {
        projectName,
        clientId: clientId === "" ? null : clientId,
        status: "draft"
      }
    }, {
      onSuccess: (data) => {
        setOpen(false);
        onSuccess(data.id);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Client (Optional)</label>
            <select 
              value={clientId}
              onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : "")}
              className="w-full h-10 px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            >
              <option value="">Select a client...</option>
              {clients?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
