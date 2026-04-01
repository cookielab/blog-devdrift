export const YEARS = Array.from({ length: 57 }, (_, i) => 1970 + i);

export interface CategoryMeta {
  label: string;
  color: string;
  desc?: string;
}

export const CATEGORIES: Record<string, CategoryMeta> = {
  technical_core: { label: 'Programming',   color: '#60a5fa', desc: 'Language mastery, algorithms, data structures, refactoring, SQL, design patterns, type systems' },
  hardware:       { label: 'Hardware',       color: '#b0c4de', desc: 'Memory management, CPU architectures, hardware impact on code performance' },
  obsluha_kodu:   { label: 'Code Ops',       color: '#67e8f9', desc: 'Debugging, automated testing, version control, software distribution' },
  architecture:   { label: 'Architecture',   color: '#fb923c', desc: 'System modularity, abstractions, integration, distributed systems, scaling, observability, security, cloud' },
  product:        { label: 'Product',        color: '#4ade80', desc: 'Product thinking, trade-off prioritization, iterative delivery, CI/CD pipelines' },
  ux:             { label: 'UX / Frontend',  color: '#c084fc', desc: 'User empathy, implementation usability, accessibility, web performance' },
  team:           { label: 'Team & Culture', color: '#f87171', desc: 'Tech-business communication, technical negotiation, developer mentoring' },
  meta:           { label: 'Meta Skills',    color: '#2dd4bf', desc: 'Working with uncertainty, technology radar, personal sustainability, technical writing' },
  ai:             { label: 'AI & ML',        color: '#FFCD68', desc: 'Prompt engineering, AI output validation, AI workflow orchestration, ML concepts' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);
export const CATEGORY_LABELS = CATEGORY_KEYS.map(k => CATEGORIES[k].label);
