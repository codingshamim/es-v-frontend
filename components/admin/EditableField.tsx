"use client";

import { useState, useRef, useEffect } from "react";

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}

export function EditableField({
  value,
  onSave,
  multiline = false,
  placeholder = "",
  className = "",
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function handleDoubleClick() {
    setEditValue(value);
    setEditing(true);
  }

  function handleBlur() {
    const trimmed = editValue.trim();
    if (trimmed !== value) {
      onSave(trimmed || value);
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setEditValue(value);
      setEditing(false);
      inputRef.current?.blur();
    }
  }

  if (editing) {
    return multiline ? (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
        className={`w-full rounded-lg border border-black/20 dark:border-white/20 bg-white dark:bg-black px-3 py-2 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 ${className}`}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-black/20 dark:border-white/20 bg-white dark:bg-black px-3 py-2 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 ${className}`}
      />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className={`cursor-text rounded px-1 -mx-1 hover:bg-black/5 dark:hover:bg-white/5 ${className}`}
      title="Double-click to edit"
    >
      {value || (
        <span className="text-black/40 dark:text-white/40 italic">
          {placeholder || "খালি - এডিট করতে ডাবল-ক্লিক করুন"}
        </span>
      )}
    </span>
  );
}
