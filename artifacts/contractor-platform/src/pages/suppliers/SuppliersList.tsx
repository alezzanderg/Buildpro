import { useState } from "react";
import { useListSuppliers, useCreateSupplier } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Truck, Plus, Globe, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function SuppliersList() {
  const { data: suppliers, isLoading, refetch } = useListSuppliers();

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Suppliers</h1>
            <p className="text-muted-foreground mt-1">Manage vendors like Home Depot, Lowe's, and local yards.</p>
          </div>
          <CreateSupplierDialog onSuccess={() => refetch()} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full p-12 text-center text-muted-foreground">Loading suppliers...</div>
          ) : suppliers?.length === 0 ? (
            <div className="col-span-full p-16 text-center text-muted-foreground bg-card border border-border rounded-xl">
              <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium text-foreground">No suppliers found</p>
            </div>
          ) : (
            suppliers?.map((supplier) => (
              <div key={supplier.id} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.05)] transition-all">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center border border-border shadow-sm">
                    <Truck className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-foreground">{supplier.name}</h3>
                </div>
                
                <div className="space-y-4 text-sm">
                  {supplier.website ? (
                    <a href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} target="_blank" rel="noreferrer" className="flex items-center text-primary hover:underline">
                      <Globe className="w-4 h-4 mr-3 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate">{supplier.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  ) : (
                    <div className="flex items-center text-muted-foreground/50">
                      <Globe className="w-4 h-4 mr-3 flex-shrink-0" />
                      <span>No website</span>
                    </div>
                  )}
                  
                  {supplier.phone ? (
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="w-4 h-4 mr-3 flex-shrink-0" />
                      <span>{supplier.phone}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-muted-foreground/50">
                      <Phone className="w-4 h-4 mr-3 flex-shrink-0" />
                      <span>No phone</span>
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t border-border/50">
                   <Button variant="outline" className="w-full text-xs h-8">View Materials</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function CreateSupplierDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  
  const createMutation = useCreateSupplier();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    createMutation.mutate({
      data: { name, website: website || null }
    }, {
      onSuccess: () => {
        setOpen(false);
        setName(""); setWebsite("");
        onSuccess();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Add Supplier
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add New Supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} required className="bg-background" placeholder="e.g. Home Depot" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Website</label>
            <Input value={website} onChange={e => setWebsite(e.target.value)} className="bg-background" placeholder="e.g. homedepot.com" />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || !name}>Save Supplier</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
