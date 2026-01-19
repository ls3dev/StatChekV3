"use client";

import { useState } from "react";

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string, title: string) => void;
}

export function AddLinkModal({ isOpen, onClose, onSave }: AddLinkModalProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSave = () => {
    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();

    if (!trimmedUrl) {
      setError("URL is required");
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setError("Please enter a valid URL (starting with http:// or https://)");
      return;
    }

    onSave(trimmedUrl, trimmedTitle || trimmedUrl);
    setUrl("");
    setTitle("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setUrl("");
    setTitle("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">Add Receipt</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              URL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              placeholder="https://example.com/article"
              className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-purple transition-colors"
              autoFocus
            />
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Title <span className="text-text-muted">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title or description"
              className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-purple transition-colors"
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 border border-white/10 hover:border-white/20 text-text-primary rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-accent-purple hover:bg-purple-500 text-white rounded-xl font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
