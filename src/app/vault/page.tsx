"use client";

import { Trash2, FileText, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
export default function VaultPage() {

  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const filteredFiles = files.filter((file) =>
  file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalStorageUsed = files.reduce((total, file) => {
  return total + (file.metadata?.size || 0);
}, 0);

const totalStorageUsedMB = (totalStorageUsed / 1024 / 1024).toFixed(2);
  const loadFiles = async () => {
  const { data, error } = await supabase.storage
    .from("knowledge-vault")
    .list();

  if (!error && data) {
    setFiles(data);
  }
};
  const handleUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];

  if (!file) return;

  setUploading(true);

  const { error } = await supabase.storage
    .from("knowledge-vault")
    .upload(`${Date.now()}-${file.name}`, file);

  if (error) {
    alert(error.message);
  } else {
    alert("Upload successful!");
    await loadFiles();
  }

  setUploading(false);
};

const deleteFile = async (fileName: string) => {
  const confirmDelete = confirm("Delete this file?");

  if (!confirmDelete) return;

  const { error } = await supabase.storage
    .from("knowledge-vault")
    .remove([fileName]);

  if (error) {
    alert(error.message);
  } else {
    alert("File deleted.");
    await loadFiles();
  }
};
  
const downloadFile = async (fileName: string) => {
  const { data, error } = await supabase.storage
    .from("knowledge-vault")
    .download(fileName);

  if (error) {
    alert(error.message);
    return;
  }

  const url = URL.createObjectURL(data);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
};

useEffect(() => {
  loadFiles();
}, []);
  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Knowledge Vault
        </h1>

        <p className="text-slate-400 mt-2">
          Your private second brain. Store, organize and retrieve knowledge.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Upload */}
        <div className="border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center">
  <div className="text-5xl mb-4">📄</div>

  <h3 className="text-xl font-semibold">
    Upload Documents
  </h3>

  <p className="text-slate-400 mt-2">
    Drag & drop files or click to browse
  </p>

  <input
  type="file"
  onChange={handleUpload}
  disabled={uploading}
  className="mt-6"
/>
{uploading && (
  <p className="mt-3 text-yellow-400">
    Uploading...
  </p>
)}


  <p className="text-xs text-slate-500 mt-4">
    PDF, DOCX, TXT, CSV
  </p>
</div>

        {/* Stats */}
        <div className="border border-slate-800 rounded-2xl p-6 bg-slate-900">
          <h2 className="text-lg font-semibold mb-4 text-white">
            Vault Status
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-slate-400 text-sm">
                Documents
              </p>
              <p className="text-2xl font-bold text-white">
  {totalStorageUsedMB} MB
</p>
            </div>

            <div>
              <p className="text-slate-400 text-sm">
                Storage Used
              </p>
              <p className="text-2xl font-bold text-yellow-400">
                0 MB
              </p>
            </div>

            <div>
              <p className="text-slate-400 text-sm">
                Status
              </p>
              <p className="text-green-400">
                Connected
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Files */}

      <div className="mt-8 border border-slate-800 rounded-2xl p-6 bg-slate-900 text-white">
        <h2 className="text-lg font-semibold mb-4 text-white">
          Recent Documents
        </h2>
        <input
  type="text"
  placeholder="Search documents..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="w-full mb-4 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400"
/>

        <div className="space-y-3">

          {files.length === 0 ? (
  <p className="text-slate-400 text-sm">
    No documents uploaded yet.
  </p>
) : (
  filteredFiles.map((file) => (
    <div
  key={file.name}
  className="p-4 rounded-xl bg-slate-800 flex items-center justify-between"
>
  <div className="flex items-center gap-3 min-w-0">
    <FileText
      size={18}
      className="text-yellow-400 shrink-0"
    />

    <div className="min-w-0">
      <p className="truncate text-white">
        {file.name}
      </p>

      <p className="text-xs text-slate-400">
  {file.metadata?.size
    ? `${(file.metadata.size / 1024 / 1024).toFixed(2)} MB`
    : "Unknown size"}
  {" • "}
  {file.created_at
    ? new Date(file.created_at).toLocaleDateString()
    : "No date"}
</p>
    </div>
  </div>

<div className="flex items-center gap-2">
  <button
    onClick={() => downloadFile(file.name)}
    className="p-2 rounded-lg text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition"
  >
    <Download size={18} />
  </button>

  <button
    onClick={() => deleteFile(file.name)}
    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
  >
    <Trash2 size={18} />
  </button>
</div>
</div>
  ))
)}

        </div>
      </div>
    </div>
  );
}