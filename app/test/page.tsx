"use client";

import { useState } from "react";
import Image from "next/image";

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUrl(data.url);
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold mb-6">
        Cloudinary Upload Test
      </h1>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="ml-4 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {url && (
        <div className="mt-8">
          <p className="mb-2 font-semibold">Uploaded successfully:</p>

         <Image
  src={url}
  alt="Uploaded product"
  width={256}
  height={256}
  className="w-64 rounded-lg object-contain"
/>

          <p className="mt-2 break-all text-sm">{url}</p>
        </div>
      )}
    </main>
  );
}