export interface Entry {
  id: string;
  title: string;
  category: 'Decision' | 'Note' | 'Proposal';
  status: 'Draft' | 'Final';
  content: string;
  createdAt: string;
}
