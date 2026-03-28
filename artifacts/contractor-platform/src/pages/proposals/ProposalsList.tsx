import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  Trash2,
  Eye,
  FileCheck,
} from "lucide-react";
import { useListProposals, useCreateProposal, useDeleteProposal } from "@/hooks/useProposals";
import { useListClients } from "@workspace/api-client-react";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft:    { label: "Draft",    variant: "secondary" },
  sent:     { label: "Sent",     variant: "default" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as const };
  const colorMap: Record<string, string> = {
    draft:    "bg-muted text-muted-foreground",
    sent:     "bg-blue-500/15 text-blue-400 border-blue-500/30",
    accepted: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorMap[status] ?? "bg-muted text-muted-foreground"}`}>
      {cfg.label}
    </span>
  );
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ProposalsList() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState("");
  const [newClientId, setNewClientId] = useState<string>("");

  const { data: proposals = [], isLoading } = useListProposals();
  const { data: clients = [] } = useListClients();
  const createProposal = useCreateProposal();
  const deleteProposal = useDeleteProposal();

  const filtered = proposals.filter(p =>
    p.projectName.toLowerCase().includes(search.toLowerCase()) ||
    p.proposalNumber.toLowerCase().includes(search.toLowerCase()) ||
    (p.clientName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    if (!newProject.trim()) return;
    try {
      const p = await createProposal.mutateAsync({
        projectName: newProject.trim(),
        clientId: newClientId ? parseInt(newClientId) : null,
      });
      setCreateOpen(false);
      setNewProject("");
      setNewClientId("");
      navigate(`/proposals/${p.id}`);
    } catch {
      toast({ title: "Failed to create proposal", variant: "destructive" });
    }
  }

  async function handleDelete(id: number, num: string) {
    if (!confirm(`Delete proposal ${num}?`)) return;
    try {
      await deleteProposal.mutateAsync(id);
      toast({ title: "Proposal deleted" });
    } catch {
      toast({ title: "Failed to delete proposal", variant: "destructive" });
    }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-primary" />
              Proposals
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Create and manage client proposals
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Proposal
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search proposals..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">#</TableHead>
                <TableHead className="text-muted-foreground font-medium">Project</TableHead>
                <TableHead className="text-muted-foreground font-medium">Client</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Valid Until</TableHead>
                <TableHead className="text-muted-foreground font-medium">Created</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    Loading proposals...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <FileText className="w-10 h-10 opacity-30" />
                      <p className="font-medium">{search ? "No proposals match your search" : "No proposals yet"}</p>
                      {!search && (
                        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)} className="gap-2 mt-1">
                          <Plus className="w-3.5 h-3.5" />
                          Create your first proposal
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(p => (
                  <TableRow
                    key={p.id}
                    className="border-border cursor-pointer group"
                    onClick={() => navigate(`/proposals/${p.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-primary font-semibold">{p.proposalNumber}</TableCell>
                    <TableCell className="font-medium text-foreground">{p.projectName}</TableCell>
                    <TableCell className="text-muted-foreground">{p.clientName ?? <span className="italic opacity-50">No client</span>}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.validUntil ? fmt(p.validUntil) : <span className="opacity-40">—</span>}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{fmt(p.createdAt)}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/proposals/${p.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(p.id, p.proposalNumber)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Totals footer */}
        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {proposals.length} proposal{proposals.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Proposal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Project Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Kitchen Remodel – Johnson Residence"
                value={newProject}
                onChange={e => setNewProject(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Client <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Select value={newClientId || "none"} onValueChange={v => setNewClientId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!newProject.trim() || createProposal.isPending}
            >
              {createProposal.isPending ? "Creating..." : "Create & Edit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
