import { useRef, useState } from "react";

export default function UploadPanel({ title, description, icon, onUpload, uploaded, rowCount, required }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv","xlsx","xls","xlsm"].includes(ext)) { alert("Please upload a .csv, .xlsx, .xls or .xlsm file."); return; }
    onUpload(file);
  };

  return (
    <div className={`upload-panel ${uploaded?"uploaded":""} ${dragging?"dragging":""}`}>
      <div className="upload-panel-header">
        <span className="upload-icon">{icon}</span>
        <div>
          <h3>{title} {required && <span className="required-badge">Required</span>}</h3>
          <p>{description}</p>
        </div>
      </div>
      <div className="drop-zone"
        onClick={() => inputRef.current.click()}
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);}}>
        {uploaded ? (
          <div className="upload-success">
            <span>✓</span><span>File loaded — {rowCount} rows</span>
            <button className="btn-replace" onClick={e=>{e.stopPropagation();inputRef.current.click();}}>Replace</button>
          </div>
        ) : (
          <div className="upload-prompt">
            <span className="upload-arrow">↑</span>
            <span>Click or drag file here</span>
            <span className="upload-formats">.csv · .xlsx · .xls · .xlsm</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.xlsm" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])} />
      </div>
    </div>
  );
}
