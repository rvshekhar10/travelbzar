'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapPin, Loader2, X, Search } from 'lucide-react';

export interface AddressSuggestion {
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Minimum characters before triggering suggestions (default 3) */
  minChars?: number;
  /** Bias string appended to Nominatim search, e.g. "Dhanbad, Jharkhand" */
  searchBias?: string;
  /** Pre-seeded local suggestions shown before / instead of network call */
  localSuggestions?: AddressSuggestion[];
  /** Tailwind ring class for focus, e.g. 'focus:ring-[#078A32]' */
  focusRingClass?: string;
  /** Tailwind hover class for dropdown rows, e.g. 'hover:bg-emerald-50' */
  accentClass?: string;
  /** Highlighted icon / accent color for selected row in hex */
  accentIconColor?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

// ─── Real-time Places Forward Geocode ─────────────────────────────────────────────
async function fetchPlaceSuggestions(
  query: string,
  signal: AbortSignal
): Promise<AddressSuggestion[]> {
  const url = `/api/places?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Places search error');
  const data = await res.json();
  if (!Array.isArray(data.results)) return [];
  return data.results.map((item: { label: string; address: string; latitude: number; longitude: number }) => ({
    label: item.label,
    address: item.address,
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}

// ─── Component ─────────────────────────────────────────────────────────────
export const AddressAutocompleteInput: React.FC<Props> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Type to search address or landmark...',
  className = '',
  inputClassName = '',
  minChars = 3,
  searchBias = 'Jharkhand, India',
  localSuggestions,
  focusRingClass = 'focus:ring-[#078A32]',
  accentClass = 'hover:bg-emerald-50',
  accentIconColor = '#078A32',
  id,
  required,
  disabled,
  autoFocus,
}) => {
  // ── Internal text — drives the input display, NOT synced back to parent on every keystroke
  // We only call parent's onChange on deliberate selection or clear, so the parent
  // doesn't re-render on every letter (which was resetting our dropdown state).
  const [inputText, setInputText] = useState(value);

  // Keep inputText in sync when parent changes value externally (e.g. preset chip applied)
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      setInputText(value);
    }
  }, [value]);

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Track the query that last populated the dropdown — prevents stale updates
  const latestQueryRef = useRef<string>('');

  // Stable reference to localSuggestions — avoids useCallback busting on every render
  // when the parent passes an inline array literal.
  const localSuggestionsRef = useRef<AddressSuggestion[]>(localSuggestions ?? []);
  useEffect(() => {
    localSuggestionsRef.current = localSuggestions ?? [];
  }, [localSuggestions]);

  // ── Close on outside click ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch suggestions ─────────────────────────────────────────────────
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (query.length < minChars) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      latestQueryRef.current = query;

      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      // 1. Instant local matches
      const lowerQ = query.toLowerCase();
      const localMatches = localSuggestionsRef.current.filter(
        (s) => s.label.toLowerCase().includes(lowerQ) || s.address.toLowerCase().includes(lowerQ)
      );
      if (localMatches.length > 0) {
        setSuggestions(localMatches.slice(0, 5));
        setIsOpen(true);
      }

      // 2. Real-time API fetch
      setIsLoading(true);
      try {
        const networkResults = await fetchPlaceSuggestions(
          query,
          abortControllerRef.current.signal
        );

        if (latestQueryRef.current !== query) return; // stale

        const seen = new Set<string>(localMatches.map((s) => s.label));
        const merged = [...localMatches];
        for (const r of networkResults) {
          if (!seen.has(r.label)) {
            seen.add(r.label);
            merged.push(r);
          }
        }
        setSuggestions(merged.slice(0, 6));
        setIsOpen(merged.length > 0);
      } catch (err: unknown) {
        // AbortError is expected on fast typing — ignore silently
        if (err instanceof Error && err.name === 'AbortError') return;
        // Network error: keep whatever local matches we already showed
      } finally {
        if (latestQueryRef.current === query) setIsLoading(false);
      }
    },
    [minChars, searchBias] // localSuggestions accessed via ref → no dependency instability
  );

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);           // update local display immediately
    setHighlightedIndex(-1);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (val.length < minChars) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      abortControllerRef.current?.abort();
      // Propagate empty / short values up so parent field isn't stale
      onChange(val);
      return;
    }

    debounceTimer.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    setInputText(suggestion.address);
    prevValueRef.current = suggestion.address; // prevent external sync from overwriting
    onChange(suggestion.address);
    onSelect(suggestion);
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    abortControllerRef.current?.abort();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  };

  const handleClear = () => {
    setInputText('');
    prevValueRef.current = '';
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    setIsLoading(false);
    abortControllerRef.current?.abort();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((p) => Math.min(p + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) handleSelect(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleFocus = () => {
    // Re-open dropdown if the user focuses back and the text is long enough
    // but only if no suggestions are currently open (avoids double-trigger)
    if (inputText.length >= minChars && suggestions.length === 0) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => fetchSuggestions(inputText), 150);
    } else if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

        <input
          ref={inputRef}
          id={id}
          type="text"
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          value={inputText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={`w-full pl-10 pr-9 py-3.5 rounded-xl border-2 border-slate-300 bg-white shadow-xs focus:outline-hidden focus:border-[#078A32] focus:ring-4 ${focusRingClass} text-base sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:text-sm transition-all ${inputClassName}`}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          ) : inputText ? (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
              className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded-md hover:bg-slate-100"
              aria-label="Clear address"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          role="listbox"
          className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Location Suggestions
            </span>
            {isLoading && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Searching…
              </span>
            )}
          </div>

          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.latitude}-${suggestion.longitude}-${index}`}
              type="button"
              role="option"
              aria-selected={index === highlightedIndex}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before mousedown fires
                handleSelect(suggestion);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 text-xs border-b border-slate-50 last:border-b-0 transition-colors ${
                index === highlightedIndex ? 'bg-emerald-50 text-slate-900' : `text-slate-700 ${accentClass}`
              }`}
            >
              <MapPin
                className="w-3.5 h-3.5 shrink-0 mt-0.5"
                style={{ color: index === highlightedIndex ? accentIconColor : '#94a3b8' }}
              />
              <span className="line-clamp-2 leading-snug font-medium">{suggestion.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && !isLoading && suggestions.length === 0 && inputText.length >= minChars && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-lg border border-slate-200 px-3.5 py-3 text-xs text-slate-500">
          No suggestions found — try a different spelling or landmark name.
        </div>
      )}
    </div>
  );
};
