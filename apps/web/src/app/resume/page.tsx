"use client";

import { useState } from "react";

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");

  const upload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      "http://localhost:5000/resume/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    setResult(JSON.stringify(data, null, 2));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Resume Upload</h1>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) =>
          setFile(e.target.files?.[0] ?? null)
        }
      />

      <button onClick={upload}>
        Upload
      </button>

      <pre>{result}</pre>
    </div>
  );
}