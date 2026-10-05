"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

/** Searchable single-select. Typing filters; only listed options can be chosen. */
export function Combobox({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Search brands",
  emptyText = "No matching brands",
  invalid = false,
  tags = {},
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  emptyText?: React.ReactNode;
  invalid?: boolean;
  /** Small label shown next to an option, keyed by option. */
  tags?: Record<string, string>;
}) {
  const listId = useId();
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [typing, setTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) setQuery(value);
  }, [value, open]);

  const filtered = useMemo(() => {
    const q = typing ? query.trim().toLowerCase() : "";
    if (!q) return options;
    const starts = options.filter((o) => o.toLowerCase().startsWith(q));
    const contains = options.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q));
    return [...starts, ...contains];
  }, [options, query, typing]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function choose(option: string) {
    onChange(option);
    setQuery(option);
    setOpen(false);
    setTyping(false);
  }

  function close() {
    const exact = options.find((o) => o.toLowerCase() === query.trim().toLowerCase());
    if (exact && exact !== value) onChange(exact);
    else setQuery(value);
    setOpen(false);
    setTyping(false);
  }

  function openList() {
    setOpen(true);
    setTyping(false);
    setActive(Math.max(0, options.indexOf(value)));
  }

  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={invalid || undefined}
          aria-activedescendant={open && filtered[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={query}
          onFocus={(e) => {
            openList();
            e.currentTarget.select();
          }}
          onClick={() => !open && openList()}
          onBlur={() => setTimeout(close, 120)}
          onChange={(e) => {
            setQuery(e.target.value);
            setTyping(true);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (!open) openList();
              else setActive((a) => Math.min(a + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              if (open && filtered[active]) {
                e.preventDefault();
                choose(filtered[active]);
              }
            } else if (e.key === "Escape") {
              setQuery(value);
              setOpen(false);
            }
          }}
          className={`h-12 w-full truncate rounded-[var(--radius-control)] border bg-white pl-10 pr-9 text-base text-ink outline-none focus-visible:outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-faint focus:border-ink focus:shadow-[0_0_0_3px_rgba(17,17,16,0.06)] ${
            invalid ? "border-danger" : "border-line hover:border-[#d6d3cf]"
          }`}
        />
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
      </div>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-y-auto overscroll-contain rounded-[var(--radius-control)] border border-line bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)]"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted">{emptyText}</li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={o === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
                onMouseMove={() => setActive(i)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-[10px] px-3 text-[15px] ${
                  i === active ? "bg-soft" : ""
                } ${o === value ? "font-semibold text-ink" : "text-ink"}`}
              >
                <span className="truncate">{o}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {tags[o] && (
                    <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] font-medium text-muted">{tags[o]}</span>
                  )}
                  {o === value && <Check aria-hidden="true" className="size-4 text-accent" />}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
