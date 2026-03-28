import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

export type ProposalSummary = {
  id: number;
  proposalNumber: string;
  clientId: number | null;
  clientName: string | null;
  projectName: string;
  status: string;
  validUntil: string | null;
  createdAt: string;
};

export type ProposalDetail = {
  id: number;
  proposalNumber: string;
  clientId: number | null;
  clientName: string | null;
  projectName: string;
  status: string;
  validUntil: string | null;
  createdAt: string;
  // Client-specific sections
  introText:       string | null;
  projectOverview: string | null;
  scopeOfWork:     string | null;
  exclusions:      string | null;
  allowances:      string | null;
  deliverables:    string | null;
  timeline:        string | null;
  paymentTerms:    string | null;
  // Standard boilerplate sections
  changeOrders:    string | null;
  siteConditions:  string | null;
  materials:       string | null;
  permits:         string | null;
  access:          string | null;
  cleanup:         string | null;
  warranty:        string | null;
  cancellation:    string | null;
  liability:       string | null;
  // Legacy / internal
  terms:           string | null;
  notes:           string | null;
};

export type CreateProposalInput = {
  projectName: string;
  clientId?: number | null;
  status?: string;
};

export type UpdateProposalInput = Partial<Omit<ProposalDetail, "id" | "proposalNumber" | "createdAt" | "clientName">>;

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function useListProposals() {
  return useQuery<ProposalSummary[]>({
    queryKey: ["proposals"],
    queryFn: () => apiFetch("/proposals"),
  });
}

export function useGetProposal(id: number, opts?: { enabled?: boolean }) {
  return useQuery<ProposalDetail>({
    queryKey: ["proposals", id],
    queryFn: () => apiFetch(`/proposals/${id}`),
    enabled: opts?.enabled ?? true,
  });
}

export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation<ProposalDetail, Error, CreateProposalInput>({
    mutationFn: (data) => apiFetch("/proposals", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals"] }),
  });
}

export function useUpdateProposal() {
  const qc = useQueryClient();
  return useMutation<ProposalDetail, Error, { id: number; data: UpdateProposalInput }>({
    mutationFn: ({ id, data }) => apiFetch(`/proposals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["proposals"] });
      qc.setQueryData(["proposals", p.id], p);
    },
  });
}

export function useDeleteProposal() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => apiFetch(`/proposals/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals"] }),
  });
}
