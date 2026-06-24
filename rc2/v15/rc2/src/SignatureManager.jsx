import { useState, useEffect } from "react";
import SignaturePad from "./SignaturePad";

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

export default function SignatureManager({ onClose }) {
  const [signatures, setSignatures] = useState({});
  const [newName, setNewName] = useState("");

  useEffect(() => { setSignatures(loadSignatures()); }, []);

  const updateSig = (name, dataUrl) => {
    const next = { ...signatures, [name]: dataUrl };
    if (!dataUrl) delete next[name];
    setSignatures(next);
    saveSignatures(next);
  };

  const addPerson = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (signatures[trimmed] !== undefined) { setNewName(""); return; }
    const next = { ...signatures, [trimmed]: null };
    setSignatures(next);
    saveSignatures(next);
    setNewName("");
  };

  const removePerson = (name) => {
    const next = { ...signatures };
    delete next[name];
    setSignatures(next);
    saveSignatures(next);
  };

  const names = Object.keys(signatures);

  return (
    <div className="sig-manager-overlay" onClick={onClose}>
      <div className="sig-manager-modal" onClick={e => e.stopPropagation()}>
        <div className="sig-manager-header">
          <h3>Manage Signatures</h3>
          <button className="sig-manager-close" onClick={onClose}>✕</button>
        </div>
        <p className="sig-manager-hint">
          Add each class advisor and the principal once. Signatures are saved in this browser and reused automatically on report cards.
        </p>

        <div className="sig-manager-add-row">
          <input
            placeholder="Name (e.g. Mr. Glen Joshua)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addPerson()}
          />
          <button onClick={addPerson}>+ Add</button>
        </div>

        <div className="sig-manager-list">
          {names.length === 0 && <p className="sig-manager-empty">No signatures added yet.</p>}
          {names.map(name => (
            <div key={name} className="sig-manager-person">
              <div className="sig-manager-person-header">
                <span>{name}</span>
                <button className="sig-manager-remove" onClick={() => removePerson(name)}>Remove</button>
              </div>
              <SignaturePad
                label=""
                value={signatures[name]}
                onChange={dataUrl => updateSig(name, dataUrl)}
              />
            </div>
          ))}
        </div>

        <button className="sig-manager-done" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
