import { useState, useEffect } from "react";
import SignaturePad from "./SignaturePad";
import { SIGNED_GRADES, GRADE_ADVISOR_MAP, gradeDisplayKey } from "./gradeAdvisors";
import { gradeSignatureMap } from "./gradeSignatures";

const STORAGE_KEY = "wzfs_signatures_v1";

export function loadSignatures() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveSignatures(sigs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sigs)); } catch {}
}

// One-time migration: earlier versions stored signatures keyed by the
// teacher's name (e.g. "Mr. Glen Joshua"). If a row's grade-key has no
// value yet but a matching legacy name-key does, carry it forward so no one
// loses a signature they already drew/uploaded under the old system.
function migrateLegacyByName(sigs, rows) {
  let changed = false;
  const next = { ...sigs };
  for (const row of rows) {
    if (next[row.key]) continue;
    const legacy = row.legacyName && next[row.legacyName];
    if (legacy) { next[row.key] = legacy; changed = true; }
  }
  return changed ? next : sigs;
}

export default function SignatureManager({ onClose, principalName }) {
  const [signatures, setSignatures] = useState({});

  // Fixed rows: one per grade with an assigned advisor, plus the principal.
  const rows = [
    ...SIGNED_GRADES.map(n => {
      const dk = gradeDisplayKey(n);          // "G6", "G7" … "ZSA"
      return {
        key: dk,
        legacyName: GRADE_ADVISOR_MAP[n],
        label: `${dk} — ${GRADE_ADVISOR_MAP[n]}`,
        defaultUrl: gradeSignatureMap[n] || null,
      };
    }),
    {
      key: "principal",
      legacyName: principalName || "Mr. Arsenio Sumeg-ang",
      label: `Principal — ${principalName || "Mr. Arsenio Sumeg-ang"}`,
      defaultUrl: gradeSignatureMap["principal"] || null,
    },
  ];

  useEffect(() => {
    const loaded = loadSignatures();
    const migrated = migrateLegacyByName(loaded, rows);
    if (migrated !== loaded) saveSignatures(migrated);
    setSignatures(migrated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSig = (key, dataUrl) => {
    const next = { ...signatures, [key]: dataUrl };
    if (!dataUrl) delete next[key];
    setSignatures(next);
    saveSignatures(next);
  };

  return (
    <div className="sig-manager-overlay" onClick={onClose}>
      <div className="sig-manager-modal" onClick={e => e.stopPropagation()}>
        <div className="sig-manager-header">
          <h3>Manage Signatures</h3>
          <button className="sig-manager-close" onClick={onClose}>✕</button>
        </div>
        <p className="sig-manager-hint">
          Each grade's class advisor signature is preloaded below and used automatically
          on report cards. If a teacher wants to sign themselves instead, Draw or Upload
          here to replace it — Clear reverts back to the preloaded signature.
        </p>

        <div className="sig-manager-list">
          {rows.map(row => {
            const override = signatures[row.key];
            const displayValue = override || row.defaultUrl || null;
            return (
              <div key={row.key} className="sig-manager-person">
                <div className="sig-manager-person-header">
                  <span className="sig-manager-person-name">{row.label}</span>
                  {!override && row.defaultUrl && <span className="sig-manager-default-tag">Preloaded</span>}
                  {override && <span className="sig-manager-override-tag">Custom</span>}
                </div>
                <SignaturePad
                  label=""
                  value={displayValue}
                  onChange={dataUrl => updateSig(row.key, dataUrl)}
                />
              </div>
            );
          })}
        </div>

        <div className="sig-manager-share-row">
          <button className="btn-sig-export" onClick={() => {
            const data = JSON.stringify(signatures, null, 2);
            const blob = new Blob([data], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "wzfs-signatures.json";
            a.click();
          }}>⬇ Export signatures</button>
          <label className="btn-sig-import">
            ⬆ Import signatures
            <input type="file" accept=".json" style={{ display: "none" }} onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => {
                try {
                  const imported = JSON.parse(ev.target.result);
                  if (typeof imported !== "object") throw new Error();
                  const next = { ...signatures, ...imported };
                  setSignatures(next);
                  saveSignatures(next);
                } catch { alert("Could not read signature file — make sure it was exported from this app."); }
              };
              reader.readAsText(file);
              e.target.value = "";
            }} />
          </label>
        </div>

        <button className="sig-manager-done" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
