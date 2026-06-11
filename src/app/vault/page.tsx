"use client";

import { useState } from "react";

export default function VaultPage() {
  const [files, setFiles] = useState<string[]>([]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const names = Array.from(selectedFiles).map((file) => file.name);
    setFiles((prev) => [...prev, ...names]);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <h1 className="text-4xl font-bold mb-6">Knowledge Vault</h1>

      <div className="bg-slate-900 rounded-2xl p-6">
        <label className="inline-block bg-yellow-500 text-slate-950 px-6 py-3 rounded-xl font-semibold cursor-pointer mb-6">
          Upload Document
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {files.length === 0 ? (
          <p className="text-slate-300">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="text-slate-200">
                📄 {file}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}