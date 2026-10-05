"use client";

type Option<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  size = "md",
}: {
  name: string;
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div
        className={`grid gap-1 rounded-[var(--radius-control)] bg-soft p-1 ${size === "sm" ? "rounded-full" : ""}`}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              className={`relative flex cursor-pointer select-none items-center justify-center font-medium transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-accent ${
                size === "sm" ? "h-8 rounded-full px-3 text-[13px]" : "h-11 rounded-[11px] text-[15px]"
              } ${checked ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]" : "text-muted hover:text-ink"}`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
