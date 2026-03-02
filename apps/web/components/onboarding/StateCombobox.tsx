"use client";

import * as React from "react";
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

  return (
    <div className="relative mt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
      >
        <div className="flex items-center justify-between">
          <span className={selected ? "text-gray-900" : "text-gray-500"}>
            {selected ? `${selected.name} (${selected.code})` : "Select your state…"}
          </span>
          <svg
            className="h-4 w-4 shrink-0 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        </div>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
            <div className="p-2">
              <input
                type="text"
                placeholder="Search state…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-auto">
              {filteredStates.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No state found.</div>
              ) : (
                <div className="p-1">
                  {filteredStates.map((s) => (
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
                        "w-full cursor-pointer rounded px-3 py-2 text-left text-sm hover:bg-gray-100",
                        value === s.code && "bg-gray-100"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          className={cn(
                            "h-4 w-4",
                            value === s.code ? "opacity-100" : "opacity-0"
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
                        <span>
                          {s.name} ({s.code})
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
