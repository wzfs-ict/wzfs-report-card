import { useRef, useState, useEffect } from "react";

export default function SignaturePad({ value, onChange, label }) {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState(value ? "upload" : "draw"); // draw | upload
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1a2e5e";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [mode]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    onChange(canvas.toDataURL("image/png"));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange(null);
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="sig-pad">
      <div className="sig-pad-header">
        <span className="sig-pad-label">{label}</span>
        <div className="sig-mode-toggle">
          <button className={mode === "draw" ? "active" : ""} onClick={() => setMode("draw")}>✏ Draw</button>
          <button className={mode === "upload" ? "active" : ""} onClick={() => setMode("upload")}>📁 Upload</button>
        </div>
      </div>

      {mode === "draw" ? (
        <div className="sig-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={400}
            height={120}
            className="sig-canvas"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          {!hasDrawn && !value && <div className="sig-canvas-hint">Sign here</div>}
          <button className="sig-clear-btn" onClick={clearCanvas}>Clear</button>
        </div>
      ) : (
        <div className="sig-upload-wrap" onClick={() => fileInputRef.current.click()}>
          {value ? (
            <img src={value} alt="signature" className="sig-preview-img" />
          ) : (
            <div className="sig-upload-prompt">Click to upload signature image</div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />
        </div>
      )}

      {value && mode === "upload" && (
        <button className="sig-clear-btn" style={{ marginTop: "4px" }} onClick={() => onChange(null)}>Remove</button>
      )}
    </div>
  );
}
