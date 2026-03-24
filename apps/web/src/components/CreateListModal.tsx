"use client";

import { useState, useEffect } from "react";
import type { ListType } from "@/lib/types";

type CreateListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, listType: ListType) => void;
  initialListType?: ListType;
};

const LIST_TYPE_OPTIONS: {
  value: ListType;
  label: string;
  description: string;
}[] = [
  { value: "ranking", label: "Ranking", description: "Ordered list for 1 or more players." },
  { value: "agenda", label: "Agenda", description: "Single-player take with receipts." },
  { value: "vs", label: "VS", description: "Head-to-head layout capped at 2 players." },
];

export function CreateListModal({
  isOpen,
  onClose,
  onCreate,
  initialListType = "ranking",
}: CreateListModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [listType, setListType] = useState<ListType>(initialListType);
  const [error, setError] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setListType(initialListType);
      setError("");
    }
  }, [isOpen, initialListType]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("List name is required");
      return;
    }

    if (trimmedName.length > 50) {
      setError("List name must be 50 characters or less");
      return;
    }

    onCreate(trimmedName, description.trim(), listType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-background-secondary rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-xl font-semibold text-text-primary">
            Create New List
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Type <span className="text-red-400">*</span>
            </label>
            <div className="grid gap-2">
              {LIST_TYPE_OPTIONS.map((option) => {
                const selected = option.value === listType;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setListType(option.value)}
                    className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                      selected
                        ? "border-accent bg-accent/10"
                        : "border-white/10 bg-background-primary hover:border-white/20"
                    }`}
                  >
                    <div className="text-sm font-semibold text-text-primary">
                      {option.label}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label
              htmlFor="listName"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              List Name <span className="text-red-400">*</span>
            </label>
            <input
              id="listName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                listType === "vs"
                  ? "Best point guard debate"
                  : listType === "agenda"
                  ? "The agenda"
                  : "Top 10 NBA centers"
              }
              maxLength={50}
              autoFocus
              className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
            />
            <div className="mt-1 text-xs text-text-muted text-right">
              {name.length}/50
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label
              htmlFor="listDescription"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Description <span className="text-text-muted">(optional)</span>
            </label>
            <textarea
              id="listDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for your list..."
              rows={3}
              maxLength={200}
              className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
            />
            <div className="mt-1 text-xs text-text-muted text-right">
              {description.length}/200
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-white/10 hover:border-white/20 text-text-primary font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-accent hover:bg-green-500 text-white font-semibold rounded-xl transition-colors"
            >
              Create {LIST_TYPE_OPTIONS.find((option) => option.value === listType)?.label}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
