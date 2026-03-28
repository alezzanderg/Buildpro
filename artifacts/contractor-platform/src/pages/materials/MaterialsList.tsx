import { useState } from "react";
import { useListMaterials, useCreateMaterial } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Search, Package, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function MaterialsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: materials, isLoading, refetch } = useListMaterials();

  const filtered = materials?.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.category && m.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.supplierName && m.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Materials Database</h1>
            <p className="text-muted-foreground mt-1">Track costs and update pricing for accurate estimates.</p>
          </div>
          <CreateMaterialDialog onSuccess={() => refetch()} />
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-card/50">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search materials by name, category, supplier..." 
                className="pl-9 bg-background border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50 border-b border-border text-sm text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Material Name</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Supplier</th>
                  <th className="px-6 py-4 font-medium">Unit</th>
                  <th className="px-6 py-4 font-medium text-right">Current Price</th>
                  <th className="px-6 py-4 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Loading materials...</td>
                  </tr>
                ) : filtered?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">No materials found</p>
                    </td>
                  </tr>
                ) : (
                  filtered?.map((mat) => (
                    <tr key={mat.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {mat.name}
                        {mat.sku && <span className="block text-xs font-mono text-muted-foreground mt-0.5">SKU: {mat.sku}</span>}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary text-foreground border border-border">
                          {mat.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {mat.supplierName || '—'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {mat.unit || 'ea'}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-right text-primary">
                        {formatCurrency(mat.currentPrice)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        <div className="flex items-center gap-2">
                          {formatDate(mat.lastUpdated)}
                          {/* Fake trend icon for visual interest */}
                          <TrendingUp className="w-3 h-3 text-red-400 opacity-50" />
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
    </AppLayout>
  );
}

function CreateMaterialDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [unit, setUnit] = useState("ea");
  
  const createMutation = useCreateMaterial();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price <= 0) return;
    
    createMutation.mutate({
      data: {
        name,
        category: category || null,
        currentPrice: price,
        unit: unit || null
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        setName(""); setCategory(""); setPrice(0);
        onSuccess();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Material to Database</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} required className="bg-background" placeholder="e.g. 2x4x8 Premium Stud" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Category</label>
              <Input value={category} onChange={e => setCategory(e.target.value)} className="bg-background" placeholder="e.g. Lumber" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Unit</label>
              <Input value={unit} onChange={e => setUnit(e.target.value)} className="bg-background" placeholder="e.g. ea, sqft, lf" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Current Price *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input type="number" step="0.01" value={price} onChange={e => setPrice(parseFloat(e.target.value)||0)} required className="pl-8 bg-background font-mono" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || !name}>Save Material</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
