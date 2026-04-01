import { useState, useEffect } from 'react';
import SkillsChart from './SkillsChart';

const CATEGORIES: Record<string, { label: string; color: string }> = {
  technical_core: { label: 'Programming',   color: '#60a5fa' },
  hardware:       { label: 'Hardware',       color: '#b0c4de' },
  obsluha_kodu:   { label: 'Code Ops',       color: '#67e8f9' },
  architecture:   { label: 'Architecture',   color: '#fb923c' },
  product:        { label: 'Product',        color: '#4ade80' },
  ux:             { label: 'UX / Frontend',  color: '#c084fc' },
  team:           { label: 'Team & Culture', color: '#f87171' },
  meta:           { label: 'Meta Skills',    color: '#2dd4bf' },
  ai:             { label: 'AI & ML',        color: '#FFCD68' },
};

const ALL_KEYS = Object.keys(CATEGORIES);

interface SkillMeta {
  name: string;
  category: string;
}

export default function SkillFilters() {
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(ALL_KEYS));
  const [hiddenSkills, setHiddenSkills] = useState<Set<string>>(new Set());
  const [skillsList, setSkillsList] = useState<SkillMeta[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());


  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/skills-timeline.json`)
      .then(r => r.json())
      .then(data => {
        setSkillsList(data.skills.map((s: any) => ({ name: s.name, category: s.category })));
      });
  }, []);

  function toggleCategory(key: string) {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        // Collapse when disabling
        setExpandedCategories(prev2 => {
          const n = new Set(prev2);
          n.delete(key);
          return n;
        });
      } else {
        next.add(key);
        // Re-show all skills in this category
        setHiddenSkills(prev2 => {
          const n = new Set(prev2);
          skillsList.filter(s => s.category === key).forEach(s => n.delete(s.name));
          return n;
        });
      }
      return next;
    });
  }

  function toggleExpand(key: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    // Also enable the category if it was off
    if (!activeCategories.has(key)) {
      setActiveCategories(prev => new Set(prev).add(key));
      setHiddenSkills(prev => {
        const n = new Set(prev);
        skillsList.filter(s => s.category === key).forEach(s => n.delete(s.name));
        return n;
      });
    }
  }

  function toggleSkill(skillName: string) {
    setHiddenSkills(prev => {
      const next = new Set(prev);
      next.has(skillName) ? next.delete(skillName) : next.add(skillName);
      return next;
    });
  }

  // Determine viewMode for SkillsChart: if any category is expanded, use 'skills'
  const viewMode = expandedCategories.size > 0 ? 'skills' as const : 'categories' as const;

  const catLabelStyle = (isActive: boolean, color: string): React.CSSProperties => ({
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: isActive ? color : '#64748b',
    opacity: isActive ? 1 : 0.5,
    fontSize: '0.85rem',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    padding: '0.4rem 0.6rem',
    textAlign: 'left' as const,
    cursor: 'default',
    transition: 'opacity 150ms, color 150ms, background 150ms',
  });

  const catExpandStyle = (isActive: boolean, isExpanded: boolean, color: string): React.CSSProperties => ({
    background: isExpanded ? `${color}15` : 'transparent',
    border: 'none',
    borderLeft: `1px solid ${isActive ? `${color}33` : '#3a3a3a'}`,
    color: isActive ? color : '#64748b',
    opacity: isActive ? 0.8 : 0.35,
    fontSize: '0.85rem',
    padding: '0.4rem 0.55rem',
    cursor: 'default',
    display: 'flex',
    alignItems: 'center',
    transition: 'opacity 150ms, color 150ms, background 150ms',
  });

  const skillBtnStyle = (isHidden: boolean, color: string): React.CSSProperties => ({
    background: isHidden ? 'transparent' : `${color}12`,
    border: `1px solid ${isHidden ? '#3a3a3a' : `${color}55`}`,
    borderRadius: '999px',
    color: isHidden ? '#64748b' : color,
    opacity: isHidden ? 0.4 : 0.85,
    fontSize: '0.78rem',
    fontWeight: 500,
    fontFamily: 'Inter, system-ui, sans-serif',
    padding: '0.2rem 0.55rem',
    cursor: 'default',
    transition: 'opacity 150ms, color 150ms, background 150ms',
    whiteSpace: 'nowrap' as const,
  });

  function selectAll() {
    setActiveCategories(new Set(ALL_KEYS));
    setHiddenSkills(new Set());
  }

  function selectNone() {
    setActiveCategories(new Set());
    setExpandedCategories(new Set());
  }

  const allActive = activeCategories.size === ALL_KEYS.length;
  const noneActive = activeCategories.size === 0;

  const utilBtnStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? '#FFCD6818' : '#2e2e2e',
    border: `1px solid ${isActive ? '#FFCD68' : '#3a3a3a'}`,
    borderRadius: '0.35rem',
    color: isActive ? '#FFCD68' : '#94a3b8',
    fontSize: '0.78rem',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    padding: '0.3rem 0.6rem',
    cursor: 'default',
    transition: 'opacity 150ms, color 150ms, background 150ms, border-color 150ms',
  });

  const sidebar = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.2rem',
      minWidth: 210,
      width: 210,
    }}>
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.35rem' }}>
        <button onClick={selectAll} className="sf-btn" style={utilBtnStyle(allActive)}>All</button>
        <button onClick={selectNone} className="sf-btn" style={utilBtnStyle(noneActive)}>None</button>
      </div>
      {Object.entries(CATEGORIES).map(([key, cat]) => {
        const isActive = activeCategories.has(key);
        const isExpanded = expandedCategories.has(key);
        const catSkills = skillsList.filter(s => s.category === key);
        const hasMultipleSkills = catSkills.length > 1;
        return (
          <div key={key}>
            <div style={{
              display: 'flex',
              border: `1px solid ${isActive ? `${cat.color}55` : '#3a3a3a'}`,
              borderRadius: '0.35rem',
              overflow: 'hidden',
              transition: 'border-color 150ms',
            }}>
              <button
                className="sf-btn"
                onClick={() => toggleCategory(key)}
                style={catLabelStyle(isActive, cat.color)}
              >
                {cat.label}
              </button>
              {hasMultipleSkills && (
                <button
                  className="sf-btn"
                  onClick={() => toggleExpand(key)}
                  style={catExpandStyle(isActive, isExpanded, cat.color)}
                  aria-label={`Expand ${cat.label} skills`}
                >
                  {isExpanded ? '▾' : '▸'}
                </button>
              )}
            </div>
            {isExpanded && isActive && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem',
                padding: '0.35rem 0',
              }}>
                {catSkills.map(skill => (
                  <button
                    className="sf-btn"
                    key={skill.name}
                    onClick={() => toggleSkill(skill.name)}
                    style={skillBtnStyle(hiddenSkills.has(skill.name), cat.color)}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ overflow: 'hidden', maxWidth: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .sf-btn:hover { background: rgba(255,255,255,0.06) !important; }
      `}} />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SkillsChart
            activeCategories={activeCategories}
            hiddenSkills={hiddenSkills}
            viewMode={viewMode}
          />
        </div>
        {sidebar}
      </div>
    </div>
  );
}
