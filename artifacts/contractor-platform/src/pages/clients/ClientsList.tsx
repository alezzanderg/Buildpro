import { useState } from "react";
import {
  useListClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Users, Plus, Search, Mail, Phone, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type Client = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  notes?: string | null;
  createdAt: string;
};

type ClientFormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
};

const EMPTY_FORM: ClientFormData = {
  name: "", email: "", phone: "",
  address: "", city: "", state: "", zip: "",
  notes: "",
};

function clientToForm(c: Client): ClientFormData {
  return {
    name: c.name,
    email: c.email ?? "",
    phone: c.phone ?? "",
    address: c.address ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    zip: c.zip ?? "",
    notes: c.notes ?? "",
  };
}

export default function ClientsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormData>(EMPTY_FORM);

  const { data: clients, isLoading, refetch } = useListClients();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();
  const { toast } = useToast();

  const filtered = clients?.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const setField = (field: keyof ClientFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setEditClient(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditClient(client);
    setForm(clientToForm(client));
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      zip: form.zip || null,
      notes: form.notes || null,
    };

    if (editClient) {
      updateMutation.mutate(
        { id: editClient.id, data: payload },
        {
          onSuccess: () => {
            setFormOpen(false);
            refetch();
            toast({ title: "Client updated" });
          },
        }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: () => {
            setFormOpen(false);
            setForm(EMPTY_FORM);
            refetch();
            toast({ title: "Client created" });
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!deleteClient) return;
    deleteMutation.mutate(
      { id: deleteClient.id },
      {
        onSuccess: () => {
          setDeleteClient(null);
          refetch();
          toast({ title: "Client deleted" });
        },
        onError: () => {
          toast({
            title: "Could not delete client",
            description: "This client may have estimates associated with them.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const count = clients?.length ?? 0;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground mt-1">
              {count} client{count !== 1 ? "s" : ""} registered
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Add Client
          </Button>
        </div>

        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-9 bg-card border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-40" />
            ))
          ) : filtered?.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-lg font-medium text-foreground">
                {searchTerm ? "No results found" : "No clients yet"}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {searchTerm ? "Try a different search term." : "Add your first client to get started."}
              </p>
              {!searchTerm && (
                <Button className="mt-4 bg-primary text-primary-foreground" onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-2" /> Add Client
                </Button>
              )}
            </div>
          ) : (
            filtered?.map((client) => (
              <ClientCard
                key={client.id}
                client={client as Client}
                onEdit={() => openEdit(client as Client)}
                onDelete={() => setDeleteClient(client as Client)}
              />
            ))
          )}
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editClient ? "Edit Client" : "New Client"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Full name or company"
                className="bg-background border-border"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="client@email.com"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="(555) 000-0000"
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Street Address</label>
              <Input
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="123 Main Street"
                className="bg-background border-border"
              />
            </div>

            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3 space-y-1.5">
                <label className="text-sm font-medium">City</label>
                <Input
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  placeholder="City"
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-1 space-y-1.5">
                <label className="text-sm font-medium">State</label>
                <Input
                  value={form.state}
                  onChange={(e) => setField("state", e.target.value.toUpperCase())}
                  placeholder="TX"
                  maxLength={2}
                  className="bg-background border-border"
                />
              </div>
              <div className="col-span-1 space-y-1.5">
                <label className="text-sm font-medium">ZIP</label>
                <Input
                  value={form.zip}
                  onChange={(e) => setField("zip", e.target.value)}
                  placeholder="12345"
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Preferences, additional info..."
                className="bg-background border-border resize-none"
                rows={3}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !form.name.trim()}>
                {isSaving ? "Saving..." : editClient ? "Save Changes" : "Create Client"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteClient} onOpenChange={(o) => !o && setDeleteClient(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteClient?.name}</strong> will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function ClientCard({
  client,
  onEdit,
  onDelete,
}: {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = client.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center text-foreground font-bold font-display border border-border">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-base text-foreground truncate">{client.name}</h3>
            {(client.city || client.state) && (
              <p className="text-xs text-muted-foreground truncate">
                {[client.city, client.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {client.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <a href={`mailto:${client.email}`} className="truncate hover:text-foreground transition-colors">
              {client.email}
            </a>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <a href={`tel:${client.phone}`} className="hover:text-foreground transition-colors">
              {client.phone}
            </a>
          </div>
        )}
        {client.address && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2 text-xs">
              {client.address}
              {client.city ? `, ${client.city}` : ""}
              {client.state ? `, ${client.state}` : ""}
              {client.zip ? ` ${client.zip}` : ""}
            </span>
          </div>
        )}
        {client.notes && (
          <p className="text-xs text-muted-foreground/70 italic line-clamp-2 pt-2 border-t border-border/50">
            {client.notes}
          </p>
        )}
      </div>
    </div>
  );
}
