"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export function StateCombobox({
  value,
  onChange,
  onSelectAndNext,
}: {
  value: string | null;
  onChange: (v: string) => void;
  onSelectAndNext?: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [mounted, setMounted] = React.useState(false);
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({});
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const selected = US_STATES.find((s) => s.code === value);

  const filteredStates = React.useMemo(() => {
    if (!search) return US_STATES;
    const lowerSearch = search.toLowerCase();
    return US_STATES.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerSearch) ||
        s.code.toLowerCase().includes(lowerSearch)
    );
  }, [search]);

  const updateMenuPosition = React.useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  React.useEffect(() => {
    if (!open) return;

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  return (
    <div className="relative mt-1">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full cursor-pointer rounded-[18px] border border-[#d9e2de] bg-white px-4 py-3 text-left text-sm shadow-sm transition focus:border-[#012825] focus:outline-none focus:ring-2 focus:ring-[#012825]/10"
      >
        <div className="flex items-center justify-between gap-4">
          <span className={selected ? "text-[#173b37]" : "text-[#173b37]/55"}>
            {selected
              ? `${selected.name} (${selected.code})`
              : "Select your state…"}
          </span>

          <svg
            className="h-4 w-4 shrink-0 text-[#173b37]/55"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4 4 4-4"
            />
          </svg>
        </div>
      </button>

      {mounted && open
        ? createPortal(
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />

              <div
                style={menuStyle}
                className="overflow-hidden rounded-[20px] border border-[#d9e2de] bg-white shadow-[0_18px_40px_rgba(1,40,37,0.12)]"
              >
                <div className="border-b border-[#eef2f0] p-3">
                  <input
                    type="text"
                    placeholder="Search state…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-[14px] border border-[#d9e2de] px-3 py-2 text-sm text-[#173b37] outline-none transition focus:border-[#012825] focus:ring-2 focus:ring-[#012825]/10"
                    autoFocus
                  />
                </div>

                <div className="max-h-64 overflow-y-auto p-2">
                  {filteredStates.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-[#173b37]/60">
                      No state found.
                    </div>
                  ) : (
                    filteredStates.map((s) => (
                      <button
                        key={s.code}
                        type="button"
                        onClick={() => {
                          onChange(s.code);
                          setOpen(false);
                          setSearch("");
                          onSelectAndNext?.(s.code);
                        }}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm text-[#173b37] transition hover:bg-[#f4f8f6]",
                          value === s.code && "bg-[#f4f8f6]"
                        )}
                      >
                        <svg
                          className={cn(
                            "h-4 w-4 shrink-0",
                            value === s.code
                              ? "opacity-100 text-[#012825]"
                              : "opacity-0"
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>

                        <span className="font-medium">
                          {s.name} ({s.code})
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
}