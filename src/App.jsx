import { useState, useMemo } from "react";

// ─── Colours ────────────────────────────────────────────────────────────────
const C = {
  celticBlue:   "#056AE6",
  haiti:        "#100F2F",
  deepSea:      "#00348A",
  blueViolet:   "#5050BC",
  freshmaker:   "#50DEAF",
  pearl:        "#F9F7F1",
  white:        "#FFFFFF",
  mediumPurple: "#AF52DE",
  green:        "#0D6E4A",
  red:          "#9B2222",
  orange:       "#8B4E00",
};

// ─── Size table (from Excel "Size estimates" sheet) ──────────────────────────
const DEFAULT_SIZE_TABLE = {
  XS:  { engineers: "1",   duration: "2–3 days",   ew: 1  },
  S:   { engineers: "1",   duration: "2 weeks",     ew: 2  },
  M:   { engineers: "2",   duration: "2–4 weeks",   ew: 6  },
  L:   { engineers: "2",   duration: "6 weeks",     ew: 12 },
  XL:  { engineers: "2–4", duration: "6–12 weeks",  ew: 27 },
  XXL: { engineers: "2–6", duration: "12–24 weeks", ew: 72 },
};

// ─── Planning horizons ───────────────────────────────────────────────────────
const HORIZONS = [
  { label: "H2 2026",               weeks: 26  },
  { label: "+ H1 2027",             weeks: 52  },
  { label: "+ H2 2027",             weeks: 78  },
  { label: "+ H1 2028",             weeks: 104 },
  { label: "+ H2 2028",             weeks: 130 },
];

// ─── Options ─────────────────────────────────────────────────────────────────
const SEGMENT_OPTIONS = ["All", "Enterprise", "Enterprise Mobile", "Education", "SMB"];
const IMPACT_OPTIONS  = [
  "KTLO/Foundational",
  "Prevents churn by handling big customer objection/blocker",
  "Prevents churn by enabling feature adoption",
  "New revenue",
];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

// ─── Backlog items (from Excel "Backlog" sheet) ───────────────────────────────
const INITIAL_ITEMS = [
  {
    id: 1, name: "Handover of Remaining Services from Red",
    description: "Handover of remaining services from Red: 7 services (full team participation), currently owning 26 services.",
    commitment: "Yes (Q3)", ahaLink: "", estimate: "XL", dependentTeams: "",
    segments: ["All"], impacts: ["KTLO/Foundational"], industryAffinity: "",
  },
  {
    id: 2, name: "Revamp Mobile App Insights through NowSecure Integration",
    description: "Augment Mobile App Insights via NowSecure; platform service plus expanded insights. Multiple phases. Dependency: NowSecure (external). Existing size only covers the platform service, with no change visible in the JSC App Insights report.",
    commitment: "Yes", ahaLink: "", estimate: "XL", dependentTeams: "External vendor",
    segments: ["Enterprise Mobile"], impacts: ["Prevents churn by enabling feature adoption", "New revenue"], industryAffinity: "",
  },
  {
    id: 3, name: "Pull in and surface NowSecure app risk, make it admin customisable",
    description: "",
    commitment: "TBD", ahaLink: "", estimate: "L", dependentTeams: "External vendor",
    segments: ["Enterprise Mobile"], impacts: ["Prevents churn by enabling feature adoption", "New revenue"], industryAffinity: "",
  },
  {
    id: 4, name: "Expand upon the visible app insights in the JSC App Insights report",
    description: "",
    commitment: "TBD", ahaLink: "", estimate: "L", dependentTeams: "",
    segments: ["Enterprise Mobile"], impacts: ["Prevents churn by enabling feature adoption", "New revenue"], industryAffinity: "",
  },
  {
    id: 5, name: "Daily Per-Device Usage Reporting",
    description: "Committed for PC 26.4, enables MoE TW ongoing renewal. Also motivated by US discussions around screen time tracking across school fleets.",
    commitment: "Yes (Q4)", ahaLink: "", estimate: "M", dependentTeams: "",
    segments: ["Education"], impacts: ["Prevents churn by handling big customer objection/blocker", "Prevents churn by enabling feature adoption", "New revenue"], industryAffinity: "",
  },
  {
    id: 6, name: "Refactor Group applicable policies — preamble to API exposure & UI refresh",
    description: "Critical for policy consolidation, API exposure and microfrontend portability. Triton × Jade collaboration. Tech debt/enabler. Reduces customer incidents from underperforming policy propagation architecture.",
    commitment: "TBD", ahaLink: "", estimate: "XL", dependentTeams: "Jade",
    segments: ["All"], impacts: ["KTLO/Foundational"], industryAffinity: "",
  },
  {
    id: 7, name: "API-First JSC Web Protection Policy Configuration",
    description: "API-first implementation as the foundation for Web Protection consolidation.",
    commitment: "TBD", ahaLink: "", estimate: "XL", dependentTeams: "",
    segments: ["All"], impacts: ["KTLO/Foundational"], industryAffinity: "",
  },
  {
    id: 8, name: "Refresh and Microfrontend the Web Protection Policy Configuration",
    description: "New UI in tandem with / following the API work. Enables reusability across the Jamf Platform.",
    commitment: "TBD", ahaLink: "", estimate: "XL", dependentTeams: "",
    segments: ["All"], impacts: ["Prevents churn by enabling feature adoption", "New revenue"], industryAffinity: "",
  },
  {
    id: 9, name: "API-First JSC Web Protection Reporting",
    description: "API-first implementation as the foundation for revamping Web Protection reporting.",
    commitment: "TBD", ahaLink: "", estimate: "XL", dependentTeams: "",
    segments: [], impacts: ["KTLO/Foundational"], industryAffinity: "",
  },
  {
    id: 10, name: "Revamp Web Protection Reports: fix latency, refresh UX and microfrontend",
    description: "Unlocks App Insights and VM exposure beyond JSC. Key FR: VM export and Red Bull's use case to only store/show Blocked sites.",
    commitment: "TBD", ahaLink: "", estimate: "XL", dependentTeams: "",
    segments: ["All"], impacts: ["Prevents churn by enabling feature adoption", "New revenue"], industryAffinity: "",
  },
  {
    id: 11, name: "Harden accuracy of data capping",
    description: "Contextual policies may take up to 1hr to apply after location change.",
    commitment: "TBD", ahaLink: "", estimate: "XL", dependentTeams: "Netopyre",
    segments: ["Enterprise Mobile"], impacts: ["Prevents churn by handling big customer objection/blocker"], industryAffinity: "",
  },
  {
    id: 12, name: "Expand app usage controls: new ways of blocking apps (WWDC26)",
    description: "WWDC26 Allowed/Blocked apps framework.",
    commitment: "TBD", ahaLink: "https://support.apple.com/en-ph/guide/deployment/depd567c9ffa/1/web/1.0", estimate: "XL", dependentTeams: "Netopyre",
    segments: ["Enterprise Mobile"], impacts: ["New revenue"], industryAffinity: "",
  },
  {
    id: 13, name: "Expand data capping controls: filter by bundle ID / app name",
    description: "Air Canada use case — restrict data capping controls by bundle ID or app name.",
    commitment: "TBD", ahaLink: "", estimate: "XL", dependentTeams: "Netopyre",
    segments: ["Enterprise Mobile"], impacts: ["Prevents churn by handling big customer objection/blocker"], industryAffinity: "",
  },
  {
    id: 14, name: "Improve usability of ODCF-based app controls: use app names instead of bundle IDs",
    description: "",
    commitment: "TBD", ahaLink: "", estimate: "L", dependentTeams: "",
    segments: ["Enterprise Mobile"], impacts: ["Prevents churn by handling big customer objection/blocker"], industryAffinity: "",
  },
  {
    id: 15, name: "SSID-based Content Filtering",
    description: "Sought after in Aviation; also catering to Education.",
    commitment: "TBD", ahaLink: "", estimate: "XL", dependentTeams: "Netopyre",
    segments: ["Enterprise Mobile", "Education"], impacts: ["Prevents churn by enabling feature adoption", "New revenue"], industryAffinity: "Aviation",
  },
  {
    id: 16, name: "Vulnerability Management for Android",
    description: "",
    commitment: "TBD", ahaLink: "", estimate: "XL", dependentTeams: "",
    segments: ["Enterprise Mobile"], impacts: ["Prevents churn by enabling feature adoption", "New revenue"], industryAffinity: "",
  },
  {
    id: 17, name: "JSI Parent/Teacher apps — closer integration with JSI Content Controls",
    description: "",
    commitment: "TBD", ahaLink: "", estimate: "XXL", dependentTeams: "Netopyre",
    segments: ["Education"], impacts: ["Prevents churn by enabling feature adoption", "New revenue"], industryAffinity: "",
  },
  {
    id: 18, name: "Harden the ways by which students can bypass content rules",
    description: "E.g. students playing Google Games via browser search. Raised by Singapore MOE and many other Edu customers.",
    commitment: "TBD", ahaLink: "", estimate: "XL", dependentTeams: "Netopyre",
    segments: ["Education"], impacts: ["Prevents churn by handling big customer objection/blocker"], industryAffinity: "",
  },
  {
    id: 19, name: "Close Uncategorised Sites Gap - AI Pod",
    description: "23% of unique sites are uncategorised — impacting EDU adoption and retention. Quality / accuracy. High priority for the EDU segment.",
    commitment: "Yes (Q3)", ahaLink: "", estimate: "L", dependentTeams: "",
    segments: ["Education"], impacts: ["Prevents churn by handling big customer objection/blocker"], industryAffinity: "",
  },
  {
    id: 20, name: "Legacy Observability Stack Migration",
    description: "Migrate legacy Observability stacks to the Paved Road. Logs — Loki and JSC ELK will be removed, migrate to Unified Logging. Traces — all Tempo deployments will be removed, migrate to Unified Tracing; migration window proposed 20–24 July 2026. Metrics — NewRelic stays for GovCloud/StateRAMP until FedRAMP/HC migration completes.",
    commitment: "Yes (Q3)", ahaLink: "", estimate: "M", dependentTeams: "",
    segments: ["All"], impacts: ["KTLO/Foundational"], industryAffinity: "",
  },
  {
    id: 21, name: "EKS Workload Tagging",
    description: "Implement tagging standards for all EKS workloads including those outside the Paved Road. Kyverno policies will enforce tagging. Supports observability stack consolidation.",
    commitment: "Yes (Q3)", ahaLink: "", estimate: "S", dependentTeams: "",
    segments: ["All"], impacts: ["KTLO/Foundational"], industryAffinity: "",
  },
  {
    id: 22, name: "Wandera to Jamf GitHub Migration",
    description: "Migrate Wandera repositories and teams into the Jamf GitHub org: 240 repositories / 26 teams. Deadline: end of 2026. Coordination in #ask-delta.",
    commitment: "Yes (Q3)", ahaLink: "", estimate: "M", dependentTeams: "Delta",
    segments: ["All"], impacts: ["KTLO/Foundational"], industryAffinity: "",
  },
  {
    id: 23, name: "Vertica to ClickHouse Migration",
    description: "Replace Vertica with ClickHouse. Owning teams: Triton, Red. Platform and BI both need to contribute. Deadline: 1 October 2026. Coordination in #discuss-vertica-replacement.",
    commitment: "Yes (Q3)", ahaLink: "", estimate: "XL", dependentTeams: "Red, BI",
    segments: ["All"], impacts: ["KTLO/Foundational"], industryAffinity: "",
  },
  {
    id: 24, name: "Stabilize Triton Services and Mitigate Maintenance to Minimum",
    description: "1) Alert Investigation Automation: AI agent on alert → Grafana/Kibana → root cause → PR/ticket. Pilot on report-service and policy-service. BLOCKER: Observability MCP access pending. 2) Support Offload via Forge MCP chatbot. 3) All Services Audit & Findings: categorization automation, Kafka optimization, Pulsar migration investigation.",
    commitment: "Yes (Q3)", ahaLink: "", estimate: "XL", dependentTeams: "",
    segments: ["All"], impacts: ["KTLO/Foundational"], industryAffinity: "",
  },
];

// ─── 3 generated scenario definitions ────────────────────────────────────────
const SCENARIO_DEFS = [
  {
    id: "ktlo",
    label: "KTLO / Foundational",
    tagline: "Foundational work across all segments, on top of committed items.",
    color: "#555",
    filter: item => (item.impacts || []).includes("KTLO/Foundational"),
  },
  {
    id: "em",
    label: "Enterprise Mobile",
    tagline: "Maximise value for Enterprise Mobile customers.",
    color: C.blueViolet,
    filter: item => (item.segments || []).some(s => s === "Enterprise Mobile"),
  },
  {
    id: "edu",
    label: "Education",
    tagline: "Fix retention risks and deepen the Education experience.",
    color: C.green,
    filter: item => (item.segments || []).some(s => s === "Education"),
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const isCommitted = item => item.commitment?.toLowerCase().startsWith("yes");
const getEW = (item, st) => (item.estimate && st[item.estimate]) ? st[item.estimate].ew : 0;

const SEGMENT_STYLE = {
  "All":               { bg: "#F1EEE8", text: "#555" },
  "Enterprise":        { bg: "#EEF4FD", text: "#00348A" },
  "Enterprise Mobile": { bg: "#F3EFFE", text: "#5050BC" },
  "Education":         { bg: "#E8FAF4", text: "#0D6E4A" },
  "SMB":               { bg: "#FFF4E6", text: "#8B4E00" },
};
const IMPACT_STYLE = {
  "KTLO/Foundational":                                          { bg: "#F1EFE8", text: "#666" },
  "Prevents churn by handling big customer objection/blocker":  { bg: "#FEF0F0", text: "#9B2222" },
  "Prevents churn by enabling feature adoption":                { bg: "#FFF4E6", text: "#8B4E00" },
  "New revenue":                                                { bg: "#EEF4FD", text: "#00348A" },
};
const IMPACT_SHORT = {
  "KTLO/Foundational":                                         "KTLO",
  "Prevents churn by handling big customer objection/blocker": "Churn: objection",
  "Prevents churn by enabling feature adoption":               "Churn: adoption",
  "New revenue":                                               "New revenue",
};

const labelSt = { display: "block", fontSize: 10, fontWeight: 600, color: "#888", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" };
const inputSt = { width: "100%", fontSize: 12, padding: "5px 8px", border: "1px solid #D0D5DD", borderRadius: 5, boxSizing: "border-box", fontFamily: "inherit", background: "#fff" };

// ─── Tag ─────────────────────────────────────────────────────────────────────
function Tag({ label, bg, text }) {
  return (
    <span style={{ display: "inline-block", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: bg, color: text, whiteSpace: "nowrap", marginRight: 3, marginBottom: 3 }}>
      {label}
    </span>
  );
}
function SegTag({ seg }) {
  const s = SEGMENT_STYLE[seg] || SEGMENT_STYLE["All"];
  return <Tag label={seg} bg={s.bg} text={s.text} />;
}
function ImpTag({ imp }) {
  const s = IMPACT_STYLE[imp] || { bg: "#F9F7F1", text: "#555" };
  return <Tag label={IMPACT_SHORT[imp] || imp} bg={s.bg} text={s.text} />;
}
function SzTag({ size }) {
  return <Tag label={size} bg="#EEF4FD" text="#00348A" />;
}

// ─── ItemCard ─────────────────────────────────────────────────────────────────
function ItemCard({ item, sizeTable, onUpdate, accentColor, overBudget, collapsible }) {
  const [editing,  setEditing]  = useState(false);
  const [draft,    setDraft]    = useState(null);
  const [expanded, setExpanded] = useState(!collapsible);
  const ac = accentColor || C.celticBlue;
  const ew = getEW(item, sizeTable);

  const startEdit = () => { setDraft({ ...item }); setEditing(true); };
  const cancel    = () => { setEditing(false); setDraft(null); };
  const save      = () => { onUpdate(draft); setEditing(false); setDraft(null); };

  const toggleMulti = (field, value, checked) => {
    const arr = draft[field] || [];
    setDraft({ ...draft, [field]: checked ? [...arr.filter(x => x !== value), value] : arr.filter(x => x !== value) });
  };

  return (
    <div style={{ borderBottom: "0.5px solid #E8ECF2", paddingBottom: 12, marginBottom: 12 }}>
      {!editing ? (
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
              {overBudget && (
                <span style={{ fontSize: 9, fontWeight: 700, color: C.red, background: "#FEF0F0", padding: "2px 5px", borderRadius: 3, flexShrink: 0, marginTop: 2 }}>OVER BUDGET</span>
              )}
              <span
                style={{ fontSize: 13, fontWeight: 600, color: C.haiti, lineHeight: 1.4, cursor: collapsible ? "pointer" : "default", flex: 1 }}
                onClick={() => collapsible && setExpanded(e => !e)}
              >
                {item.name}
                {collapsible && <span style={{ fontSize: 10, color: "#CCC", marginLeft: 6 }}>{expanded ? "▲" : "▼"}</span>}
              </span>
            </div>
            {expanded && (
              <>
                {item.description && (
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2, marginBottom: 6, lineHeight: 1.5 }}>{item.description}</div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  <SzTag size={item.estimate || "–"} />
                  {(item.segments || []).map(s => <SegTag key={s} seg={s} />)}
                  {(item.impacts || []).map(i => <ImpTag key={i} imp={i} />)}
                  {item.dependentTeams && <Tag label={`Dep: ${item.dependentTeams}`} bg="#F9F7F1" text="#666" />}
                  {item.industryAffinity && <Tag label={item.industryAffinity} bg="#FFF4E6" text="#8B4E00" />}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 4, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#999" }}>{ew} eng-weeks</span>
                  {item.commitment && item.commitment !== "TBD" && (
                    <span style={{ fontSize: 11, color: isCommitted(item) ? C.green : "#AAA" }}>
                      {isCommitted(item) ? "✓ " : "? "}{item.commitment}
                    </span>
                  )}
                  {item.ahaLink && (
                    <a href={item.ahaLink} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.celticBlue, textDecoration: "none" }}>Aha ↗</a>
                  )}
                </div>
              </>
            )}
            {!expanded && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                <SzTag size={item.estimate || "–"} />
                <span style={{ fontSize: 11, color: "#999" }}>{ew} ew</span>
                {item.commitment && isCommitted(item) && (
                  <span style={{ fontSize: 11, color: C.green }}>✓ {item.commitment}</span>
                )}
              </div>
            )}
          </div>
          <button onClick={startEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "#CCC", fontSize: 15, flexShrink: 0, padding: "0 2px", lineHeight: 1 }} title="Edit">✎</button>
        </div>
      ) : (
        <div style={{ background: "#F8FAFF", borderRadius: 8, padding: 12, border: `1px solid ${ac}50` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: ac, marginBottom: 10 }}>Edit item</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelSt}>Description</label>
              <textarea value={draft.description || ""} onChange={e => setDraft({ ...draft, description: e.target.value })} style={{ ...inputSt, height: 60, resize: "vertical" }} />
            </div>
            <div>
              <label style={labelSt}>Estimate</label>
              <select value={draft.estimate || ""} onChange={e => setDraft({ ...draft, estimate: e.target.value })} style={inputSt}>
                <option value="">–</option>
                {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSt}>Commitment for 2026</label>
              <input value={draft.commitment || ""} onChange={e => setDraft({ ...draft, commitment: e.target.value })} style={inputSt} placeholder="Yes / TBD / No" />
            </div>
            <div>
              <label style={labelSt}>Dependent Teams</label>
              <input value={draft.dependentTeams || ""} onChange={e => setDraft({ ...draft, dependentTeams: e.target.value })} style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Aha Link</label>
              <input value={draft.ahaLink || ""} onChange={e => setDraft({ ...draft, ahaLink: e.target.value })} style={inputSt} placeholder="https://..." />
            </div>
            <div>
              <label style={labelSt}>Customer Segment</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 2 }}>
                {SEGMENT_OPTIONS.map(seg => (
                  <label key={seg} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
                    <input type="checkbox"
                      checked={(draft.segments || []).includes(seg)}
                      onChange={e => toggleMulti("segments", seg, e.target.checked)} />
                    {seg}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelSt}>Business Impact</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 2 }}>
                {IMPACT_OPTIONS.map(imp => (
                  <label key={imp} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
                    <input type="checkbox"
                      checked={(draft.impacts || []).includes(imp)}
                      onChange={e => toggleMulti("impacts", imp, e.target.checked)} />
                    {IMPACT_SHORT[imp] || imp}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={save} style={{ fontSize: 12, padding: "5px 14px", background: ac, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Save</button>
            <button onClick={cancel} style={{ fontSize: 12, padding: "5px 14px", background: "#F0F2F5", color: "#555", border: "none", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Size table editor ────────────────────────────────────────────────────────
function SizeTableEditor({ sizeTable, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={() => setOpen(o => !o)} style={{ fontSize: 11, fontWeight: 700, color: "#888", background: "none", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.07em", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{open ? "▼" : "▶"}</span> Size estimate table {open ? "(click to collapse)" : "(click to edit eng-week values)"}
      </button>
      {open && (
        <div style={{ marginTop: 10, background: C.pearl, borderRadius: 10, padding: "12px 16px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Size", "Engineers", "Duration", "Eng-weeks (editable)"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "4px 8px", color: "#888", fontWeight: 600, fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid #E2DFD6" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIZE_OPTIONS.map(size => (
                <tr key={size}>
                  <td style={{ padding: "5px 8px", fontWeight: 700, color: C.deepSea, fontFamily: "monospace" }}>{size}</td>
                  <td style={{ padding: "5px 8px", color: "#555" }}>{sizeTable[size]?.engineers}</td>
                  <td style={{ padding: "5px 8px", color: "#555" }}>{sizeTable[size]?.duration}</td>
                  <td style={{ padding: "5px 8px" }}>
                    <input
                      type="number" min={0} value={sizeTable[size]?.ew ?? 0}
                      onChange={e => onChange({ ...sizeTable, [size]: { ...sizeTable[size], ew: Number(e.target.value) } })}
                      style={{ width: 60, fontSize: 12, padding: "3px 6px", border: "1px solid #D0D5DD", borderRadius: 4, textAlign: "right" }}
                    />
                    <span style={{ marginLeft: 4, color: "#999", fontSize: 11 }}>ew</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────
function Metric({ label, value, sub, accent }) {
  return (
    <div style={{ background: C.pearl, borderRadius: 10, padding: "12px 16px", flex: 1, minWidth: 100 }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent || C.haiti, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#AAA", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Budget bar ───────────────────────────────────────────────────────────────
function BudgetBar({ used, total, color }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const over = used > total;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: "#E8ECF2", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: over ? C.red : color, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 11, color: over ? C.red : "#666", minWidth: 90, fontWeight: over ? 700 : 400 }}>{used} / {total} ew</span>
    </div>
  );
}

// ─── Scenario panel ───────────────────────────────────────────────────────────
function ScenarioPanel({ def, items, sizeTable, budget, onUpdate }) {
  const nonCommitted = items.filter(i => !isCommitted(i));
  const matching     = nonCommitted.filter(def.filter);
  const nonMatching  = nonCommitted.filter(i => !def.filter(i));

  let running = 0;
  const inScope = [], overBudget = [];
  for (const item of matching) {
    const ew = getEW(item, sizeTable);
    if (running + ew <= budget) { inScope.push(item); running += ew; }
    else { overBudget.push(item); }
  }

  const [showNonMatching, setShowNonMatching] = useState(false);

  return (
    <div>
      {/* scenario header */}
      <div style={{ background: C.pearl, borderRadius: 12, padding: "14px 18px", marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.haiti, marginBottom: 3 }}>{def.label}</div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>{def.tagline}</div>
        <BudgetBar used={running} total={budget} color={def.color} />
        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#E8FAF4", color: C.green, fontWeight: 600 }}>
            {budget - running} ew buffer
          </span>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#F9F7F1", color: "#666" }}>
            {inScope.length} items in scope · {overBudget.length} over budget
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 12, marginBottom: 14 }}>
        {/* in scope */}
        <div style={{ background: C.white, border: "0.5px solid #E8ECF2", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ✓ In scope — {inScope.length} items · {running} ew
          </div>
          {inScope.length === 0 && <div style={{ fontSize: 12, color: "#AAA" }}>No items fit within the current budget.</div>}
          {inScope.map(item => (
            <ItemCard key={item.id} item={item} sizeTable={sizeTable} onUpdate={onUpdate} accentColor={def.color} overBudget={false} />
          ))}
        </div>

        {/* over budget / not in scenario */}
        <div style={{ background: C.white, border: "0.5px solid #E8ECF2", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ✕ Over budget — {overBudget.length} items
          </div>
          {overBudget.length === 0
            ? <div style={{ fontSize: 12, color: "#AAA" }}>All matching items fit.</div>
            : overBudget.map(item => (
              <div key={item.id} style={{ borderBottom: "0.5px solid #F0F2F5", padding: "7px 0" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 3 }}>{item.name}</div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  <SzTag size={item.estimate || "–"} />
                  {(item.segments || []).map(s => <SegTag key={s} seg={s} />)}
                  {(item.impacts || []).map(imp => <ImpTag key={imp} imp={imp} />)}
                </div>
                <div style={{ fontSize: 11, color: "#AAA", marginTop: 3 }}>{getEW(item, sizeTable)} ew</div>
              </div>
            ))
          }

          {nonMatching.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <button onClick={() => setShowNonMatching(o => !o)} style={{ fontSize: 10, fontWeight: 700, color: "#AAA", background: "none", border: "none", cursor: "pointer", padding: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {showNonMatching ? "▼" : "▶"} {nonMatching.length} items not in this scenario
              </button>
              {showNonMatching && (
                <div style={{ marginTop: 8 }}>
                  {nonMatching.map(item => (
                    <div key={item.id} style={{ borderBottom: "0.5px solid #F5F5F5", padding: "5px 0" }}>
                      <div style={{ fontSize: 11, color: "#BBB" }}>{item.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function TritonDashboard() {
  const [items,      setItems]      = useState(INITIAL_ITEMS);
  const [sizeTable,  setSizeTable]  = useState(DEFAULT_SIZE_TABLE);
  const [engineers,  setEngineers]  = useState(6);
  const [horizonIdx, setHorizonIdx] = useState(0);
  const [activeTab,  setActiveTab]  = useState("ktlo");

  const horizon       = HORIZONS[horizonIdx];
  const totalCapacity = engineers * horizon.weeks;
  const committed     = items.filter(isCommitted);
  const committedEW   = committed.reduce((sum, i) => sum + getEW(i, sizeTable), 0);
  const discretionary = Math.max(0, totalCapacity - committedEW);

  const updateItem = updated => setItems(prev => prev.map(i => i.id === updated.id ? updated : i));

  const activeScenario = SCENARIO_DEFS.find(s => s.id === activeTab);

  return (
    <div style={{ fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif", color: C.haiti, background: C.white, minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div style={{ background: C.haiti, padding: "18px 28px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="6" fill="#056AE6"/>
              <path d="M8 16C8 11.582 11.582 8 16 8C20.418 8 24 11.582 24 16C24 20.418 20.418 24 16 24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="16" cy="16" r="3" fill="white"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.freshmaker, letterSpacing: "0.08em", textTransform: "uppercase" }}>Triton team</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.white }}>H2 capacity planning</div>
          <div style={{ fontSize: 12, color: "#9BA8BF", marginTop: 2 }}>Web protection · App intelligence · JSI</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#9BA8BF", marginBottom: 1 }}>Backlog vs discretionary budget</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.celticBlue }}>
            {discretionary > 0 ? `${Math.round(items.filter(i => !isCommitted(i)).reduce((s, i) => s + getEW(i, sizeTable), 0) / discretionary)}×` : "–"}
          </div>
          <div style={{ fontSize: 10, color: "#9BA8BF" }}>
            {items.filter(i => !isCommitted(i)).reduce((s, i) => s + getEW(i, sizeTable), 0)} ew backlog / {discretionary} ew available
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>

        {/* ── Controls ── */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* engineer count */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Engineers</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setEngineers(e => Math.max(1, e - 1))} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #D0D5DD", background: C.white, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
              <span style={{ fontSize: 18, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{engineers}</span>
              <button onClick={() => setEngineers(e => Math.min(30, e + 1))} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #D0D5DD", background: C.white, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
          </div>

          {/* horizon */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Planning horizon</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {HORIZONS.map((h, i) => (
                <button key={i} onClick={() => setHorizonIdx(i)} style={{
                  fontSize: 11, padding: "5px 10px", borderRadius: 6, cursor: "pointer", border: horizonIdx === i ? `1.5px solid ${C.celticBlue}` : "1px solid #D0D5DD",
                  background: horizonIdx === i ? "#EEF4FD" : C.white, color: horizonIdx === i ? C.celticBlue : "#555", fontWeight: horizonIdx === i ? 700 : 400,
                }}>
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Capacity metrics ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <Metric label="Total capacity" value={totalCapacity} sub={`${engineers} eng × ${horizon.weeks} wks`} />
          <Metric label="Committed (fixed)" value={committedEW} sub="non-negotiable" accent={C.red} />
          <Metric label="Discretionary budget" value={discretionary} sub="eng-weeks available" accent={C.celticBlue} />
          <Metric label="Discretionary backlog" value={items.filter(i => !isCommitted(i)).reduce((s, i) => s + getEW(i, sizeTable), 0)} sub={`${items.filter(i => !isCommitted(i)).length} items`} accent={C.blueViolet} />
        </div>

        {/* ── Size table editor ── */}
        <SizeTableEditor sizeTable={sizeTable} onChange={setSizeTable} />

        {/* ── Committed baseline ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
            Fixed baseline — committed items (all scenarios) · {committedEW} ew
          </div>
          <div style={{ background: C.pearl, borderRadius: 10, padding: "10px 16px" }}>
            {committed.length === 0 && <div style={{ fontSize: 12, color: "#AAA" }}>No committed items yet.</div>}
            {committed.map(item => (
              <div key={item.id}>
                <div style={{ marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#EEF4FD", color: C.deepSea }}>COMMITTED</span>
                </div>
                <ItemCard item={item} sizeTable={sizeTable} onUpdate={updateItem} accentColor={C.celticBlue} overBudget={false} collapsible={true} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Scenario tabs ── */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
            Generated scenarios — based on {horizon.label} · {engineers} engineers · {discretionary} ew discretionary
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {SCENARIO_DEFS.map(s => {
              const isActive = activeTab === s.id;
              return (
                <button key={s.id} onClick={() => setActiveTab(s.id)} style={{
                  flex: 1, padding: "10px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                  border: isActive ? `2px solid ${s.color}` : "0.5px solid #D0D5DD",
                  background: isActive ? `${s.color}12` : C.white,
                  color: isActive ? s.color : "#555", transition: "all 0.15s",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: isActive ? s.color : "#AAA", marginTop: 2, lineHeight: 1.3 }}>{s.tagline}</div>
                </button>
              );
            })}
          </div>
          {activeScenario && (
            <ScenarioPanel
              def={activeScenario}
              items={items}
              sizeTable={sizeTable}
              budget={discretionary}
              onUpdate={updateItem}
            />
          )}
        </div>

        <div style={{ marginTop: 20, fontSize: 11, color: "#AAA", lineHeight: 1.6, paddingBottom: "1rem" }}>
          Estimates use eng-week midpoints from the size table above — edit them to recalculate. Committed items are deducted before discretionary budget is computed. Scenario item selection follows file order (priority order); items are included greedily until budget is exhausted. Buffer is intentional risk absorption, not slack.
        </div>
      </div>
    </div>
  );
}
