import { useState } from "react";
import { useListInvoices } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, formatDate } from "@/lib/format";
import { Search, Filter, Receipt, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InvoicesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: invoices, isLoading } = useListInvoices();

  const filteredInvoices = invoices?.filter(inv => 
    inv.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.clientName && inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Invoices</h1>
            <p className="text-muted-foreground mt-1">Manage billing and payments.</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between bg-card/50">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search invoices..." 
                className="pl-9 bg-background border-border"
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
                  <th className="px-6 py-4 font-medium">Invoice #</th>
                  <th className="px-6 py-4 font-medium">Project Name</th>
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Due Date</th>
                  <th className="px-6 py-4 font-medium text-right">Amount Due</th>
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
                        Loading invoices...
                      </div>
                    </td>
                  </tr>
                ) : filteredInvoices?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                      <Receipt className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium text-foreground">No invoices found</p>
                      <p className="text-sm mt-1">Convert an estimate to an invoice to see it here.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices?.map((inv) => (
                    <tr key={inv.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {inv.projectName}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {inv.clientName || '—'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-right text-foreground">
                        {formatCurrency(inv.amountDue)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary hover:bg-primary/10" disabled>
                          View <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
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
    paid: "bg-green-500/10 text-green-400 border-green-500/20",
    overdue: "bg-destructive/10 text-destructive border-destructive/20",
    cancelled: "bg-muted text-muted-foreground border-border",
  };
  
  const defaultStyle = "bg-secondary text-muted-foreground border-border";
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status.toLowerCase()] || defaultStyle}`}>
      {status.toUpperCase()}
    </span>
  );
}
