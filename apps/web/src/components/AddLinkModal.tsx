"use client";

import { useState, useEffect, useCallback } from "react";

interface LinkPreview {
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  url: string;
}

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string, title: string) => void;
}

export function AddLinkModal({ isOpen, onClose, onSave }: AddLinkModalProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // Fetch preview when URL changes
  const fetchPreview = useCallback(async (urlToFetch: string) => {
    if (!isValidUrl(urlToFetch)) {
      setPreview(null);
      setPreviewError("");
      return;
    }

    setIsLoadingPreview(true);
    setPreviewError("");

    try {
      const response = await fetch(
        `/api/link-preview?url=${encodeURIComponent(urlToFetch)}`
      );

      if (!response.ok) {
        const data = await response.json();
        setPreviewError(data.error || "Failed to fetch preview");
        setPreview(null);
        return;
      }

      const data: LinkPreview = await response.json();
      setPreview(data);

      // Auto-fill title if empty and preview has a title
      if (!title && data.title) {
        setTitle(data.title);
      }
    } catch {
      setPreviewError("Failed to fetch preview");
      setPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [title]);

  // Debounce URL changes
  useEffect(() => {
    if (!url.trim()) {
      setPreview(null);
      setPreviewError("");
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchPreview(url.trim());
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [url, fetchPreview]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUrl("");
      setTitle("");
      setError("");
      setPreview(null);
      setPreviewError("");
      setIsLoadingPreview(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function isValidUrl(urlString: string): boolean {
    try {
      const parsedUrl = new URL(urlString);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  }

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
    setPreview(null);
    onClose();
  };

  const handleClose = () => {
    setUrl("");
    setTitle("");
    setError("");
    setPreview(null);
    setPreviewError("");
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

          {/* Preview Card */}
          {isLoadingPreview && (
            <div className="flex items-center gap-3 p-4 bg-background-primary border border-white/10 rounded-xl">
              <div className="animate-spin w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full" />
              <span className="text-text-muted text-sm">Fetching preview...</span>
            </div>
          )}

          {preview && !isLoadingPreview && (
            <div className="p-4 bg-background-primary border border-white/10 rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                {/* Favicon */}
                {preview.favicon && (
                  <img
                    src={preview.favicon}
                    alt=""
                    className="w-5 h-5 rounded flex-shrink-0 mt-0.5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  {preview.title && (
                    <p className="text-text-primary font-medium text-sm truncate">
                      {preview.title}
                    </p>
                  )}
                  {/* Description */}
                  {preview.description && (
                    <p className="text-text-muted text-xs mt-1 line-clamp-2">
                      {preview.description}
                    </p>
                  )}
                  {/* URL display */}
                  <p className="text-text-muted text-xs mt-1 truncate opacity-60">
                    {new URL(preview.url).hostname}
                  </p>
                </div>
              </div>
              {/* Preview Image */}
              {preview.image && (
                <img
                  src={preview.image}
                  alt=""
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
          )}

          {previewError && !isLoadingPreview && (
            <p className="text-text-muted text-xs px-1">
              Preview unavailable: {previewError}
            </p>
          )}

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
            disabled={isLoadingPreview}
            className="flex-1 px-4 py-3 bg-accent-purple hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
