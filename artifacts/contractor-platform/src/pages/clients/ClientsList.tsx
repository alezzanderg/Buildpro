import { useState } from "react";
import { useListClients, useCreateClient } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Users, Plus, Search, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ClientsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: clients, isLoading, refetch } = useListClients();

  const filtered = clients?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground mt-1">Manage your customer relationships.</p>
          </div>
          <CreateClientDialog onSuccess={() => refetch()} />
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-card/50">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search clients..." 
                className="pl-9 bg-background border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 p-0 sm:p-4 bg-background/50">
            {isLoading ? (
              <div className="col-span-full p-12 text-center text-muted-foreground">Loading clients...</div>
            ) : filtered?.length === 0 ? (
              <div className="col-span-full p-16 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium text-foreground">No clients found</p>
              </div>
            ) : (
              filtered?.map((client) => (
                <div key={client.id} className="p-4 sm:p-2">
                  <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold font-display border border-border">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="font-semibold text-lg text-foreground">{client.name}</h3>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mt-auto pt-2 text-sm">
                      {client.email && (
                        <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                          <Mail className="w-4 h-4 mr-3 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                          <Phone className="w-4 h-4 mr-3 flex-shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-start text-muted-foreground hover:text-foreground transition-colors">
                          <MapPin className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{client.address} {client.city ? `, ${client.city}` : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function CreateClientDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  const createMutation = useCreateClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    createMutation.mutate({
      data: { name, email: email || null, phone: phone || null }
    }, {
      onSuccess: () => {
        setOpen(false);
        setName(""); setEmail(""); setPhone("");
        onSuccess();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} required className="bg-background" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="bg-background" />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || !name}>Save Client</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
