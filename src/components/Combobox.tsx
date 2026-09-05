import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface ComboboxOption {
  value: string;
  label: string;
  /** extra text to match against (e.g. brand name) that isn't shown twice in the label */
  keywords?: string;
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyLabel?: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
}

const LIST_MAX_HEIGHT = 280;
const LIST_GAP = 6;

export function Combobox({ value, onChange, options, placeholder, emptyLabel }: ComboboxProps) {
  const selected = options.find((o) => o.value === value);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    setQuery(options.find((o) => o.value === value)?.label ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const filtered = query.trim()
    ? options.filter((o) => `${o.label} ${o.keywords ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (inputRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
      setQuery(options.find((o) => o.value === value)?.label ?? "");
    }
    function handleScrollOrResize() {
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function computeRect() {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < Math.min(LIST_MAX_HEIGHT, 160) && r.top > spaceBelow;
    setRect({
      top: openUp ? r.top - LIST_GAP : r.bottom + LIST_GAP,
      left: r.left,
      width: r.width,
      openUp,
    });
  }

  function handleFocus() {
    computeRect();
    setOpen(true);
    setActiveIndex(0);
  }

  function choose(opt: ComboboxOption) {
    onChange(opt.value);
    setQuery(opt.label);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "Escape") {
      setOpen(false);
      setQuery(options.find((o) => o.value === value)?.label ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) choose(opt);
    }
  }

  return (
    <div className="ui-combobox">
      <input
        ref={inputRef}
        className="text-input"
        type="text"
        value={query}
        placeholder={placeholder ?? "Rechercher..."}
        onFocus={handleFocus}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) computeRect();
          setOpen(true);
          setActiveIndex(0);
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />

      {open && rect
        ? createPortal(
            <ul
              className={`ui-select-list${rect.openUp ? " up" : ""}`}
              role="listbox"
              ref={listRef}
              style={{
                position: "fixed",
                left: rect.left,
                width: rect.width,
                maxHeight: LIST_MAX_HEIGHT,
                ...(rect.openUp ? { bottom: window.innerHeight - rect.top } : { top: rect.top }),
              }}
            >
              {filtered.length === 0 ? (
                <li className="ui-select-option disabled">{emptyLabel ?? "Aucun résultat"}</li>
              ) : (
                filtered.map((opt, i) => (
                  <li
                    key={opt.value}
                    ref={(el) => { optionRefs.current[i] = el; }}
                    role="option"
                    aria-selected={opt.value === value}
                    className={["ui-select-option", opt.value === value ? "selected" : "", i === activeIndex ? "active" : ""].filter(Boolean).join(" ")}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => choose(opt)}
                  >
                    {opt.label}
                    {opt.value === value ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className="ui-select-check">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : null}
                  </li>
                ))
              )}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
