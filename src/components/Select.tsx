import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  tone?: SelectTone;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
}

function OptionLabel({ option }: { option: SelectOption }) {
  if (option.tone) {
    return <span className={`badge ${option.tone}`}>{option.label}</span>;
  }
  return <>{option.label}</>;
}

function nextEnabledIndex(options: SelectOption[], from: number, dir: 1 | -1): number {
  if (!options.length) return -1;
  let i = from;
  for (let step = 0; step < options.length; step++) {
    i = (i + dir + options.length) % options.length;
    if (!options[i]?.disabled) return i;
  }
  return from;
}

const LIST_MAX_HEIGHT = 264;
const LIST_GAP = 6;

export function Select({ value, onChange, options, placeholder, size = "md", className, ...aria }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [rect, setRect] = useState<Rect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleScrollOrResize() {
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    // A dropdown positioned via fixed coordinates would go stale on scroll —
    // closing is simpler and safer than trying to keep it glued to the trigger.
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function openList() {
    const el = triggerRef.current;
    if (el) {
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
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : nextEnabledIndex(options, -1, 1));
    setOpen(true);
  }

  function choose(index: number) {
    const opt = options[index];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        openList();
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => nextEnabledIndex(options, i, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => nextEnabledIndex(options, i, -1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(activeIndex);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div className={`ui-select${className ? ` ${className}` : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`ui-select-trigger ui-select-${size}${open ? " open" : ""}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        {...aria}
      >
        <span className="ui-select-value">
          {selected ? <OptionLabel option={selected} /> : <span className="ui-select-placeholder">{placeholder ?? "Choisir"}</span>}
        </span>
        <svg className="ui-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

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
              {options.map((opt, i) => (
                <li
                  key={opt.value}
                  ref={(el) => { optionRefs.current[i] = el; }}
                  role="option"
                  aria-selected={opt.value === value}
                  aria-disabled={opt.disabled}
                  className={[
                    "ui-select-option",
                    opt.value === value ? "selected" : "",
                    i === activeIndex ? "active" : "",
                    opt.disabled ? "disabled" : "",
                  ].filter(Boolean).join(" ")}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => choose(i)}
                >
                  <OptionLabel option={opt} />
                  {opt.value === value ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className="ui-select-check">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : null}
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}

export function selectOptions(labels: Record<string, string>): SelectOption[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}
