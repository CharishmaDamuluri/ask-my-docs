"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUploadMsg(`✅ ${data.message}`);
      } else {
        setUploadMsg(`❌ ${data.error}`);
      }
    } catch {
      setUploadMsg("❌ Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Ask My Docs</h1>

      {/* Upload */}
      <div className="border rounded-xl p-4 space-y-2">
        <p className="text-sm font-medium">Upload a document</p>
        <input
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleUpload}
          disabled={uploading}
          className="text-sm"
        />
        {uploadMsg && <p className="text-sm">{uploadMsg}</p>}
      </div>

      {/* Messages */}
      <div className="space-y-3 min-h-[200px]">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm">
            Upload a doc then ask a question...
          </p>
        )}
        {messages.map((m) => {
          // only render user and assistant roles, skip others
          if (m.role !== "user" && m.role !== "assistant") return null;

          return (
            <div
              key={m.id}
              className={`p-3 rounded-xl text-sm ${
                m.role === "user" ? "bg-blue-100 ml-8" : "bg-gray-100 mr-8"
              }`}
            >
              <p className="font-medium mb-1">
                {m.role === "user" ? "You" : "AI"}
              </p>
              <p className="whitespace-pre-wrap">
                {m.parts
                  .filter((p) => p.type === "text")
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("")}
              </p>
            </div>
          );
        })}
        {status === "streaming" && (
          <div className="bg-gray-100 p-3 rounded-xl text-sm text-gray-400 mr-8">
            Searching your docs...
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage({ text: input });
          setInput("");
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your documents..."
          className="flex-1 border rounded-xl px-4 py-2 text-sm"
          disabled={status !== "ready"}
        />
        <button
          type="submit"
          disabled={status !== "ready" || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </main>
  );
}
