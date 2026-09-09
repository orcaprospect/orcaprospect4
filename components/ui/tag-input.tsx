"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Input } from "./input";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

/** Campo de tags: Enter ou vírgula adiciona; chips removíveis. */
export function TagInput({ value, onChange, suggestions = [], placeholder = "Adicionar tag…" }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim().replace(/\s+/g, " ").slice(0, 24);
    if (!tag) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const available = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200"
            >
              {tag}
              <button
                onClick={() => remove(tag)}
                className="rounded-full p-0.5 hover:bg-indigo-100"
                aria-label={`Remover tag ${tag}`}
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          }
        }}
        placeholder={placeholder}
        maxLength={24}
      />
      {available.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400">Sugestões:</span>
          {available.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
