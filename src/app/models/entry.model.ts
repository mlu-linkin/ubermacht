export interface Entry {
  id: string;
  title: string;
  category: 'Decision' | 'Note' | 'Proposal';
  status: 'Draft' | 'Final';
  createdAt: string;
}
