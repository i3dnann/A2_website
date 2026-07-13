export type NewspaperBlock = {
  type: string;
  article_id?: string;
  headline?: string;
  deck?: string;
  body?: string;
  image?: string;
  category?: string;
  author?: string;
  caption?: string;
  lead?: boolean;
  label?: string;
  link?: string;
};
export type NewspaperPage = {
  id: string;
  issue_id: string;
  page_number: number;
  internal_label?: string;
  section_name?: string;
  template_key: string;
  blocks: NewspaperBlock[];
  style?: Record<string, unknown>;
  is_hidden?: number;
};
export type NewspaperIssue = {
  id: string;
  issue_number: string;
  name: string;
  slug: string;
  status: string;
  publication_date?: string;
  page_count?: number;
  settings?: Record<string, unknown>;
};
export type NewspaperSettings = {
  newspaper_name: string;
  motto?: string;
  logo_url?: string;
  sound_url?: string;
  style: Record<string, any>;
};
export type NewspaperBundle = {
  issue: NewspaperIssue;
  pages: NewspaperPage[];
  settings: NewspaperSettings;
};
