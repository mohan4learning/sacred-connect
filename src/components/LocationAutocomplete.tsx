import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchCities, searchAreas, getCitiesSync, getAreasForCity } from "@/lib/indianLocations";

interface LocationAutocompleteProps {
  type: 'city' | 'area';
  value: string;
  onChange: (value: string) => void;
  city?: string; // Required for area type
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function LocationAutocomplete({
  type,
  value,
  onChange,
  city = "",
  placeholder,
  className,
  disabled = false,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      if (type === 'city') {
        const results = await searchCities(query);
        setSuggestions(results);
      } else if (type === 'area' && city) {
        const results = await searchAreas(city, query);
        setSuggestions(results);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Fallback to sync methods
      if (type === 'city') {
        setSuggestions(getCitiesSync().slice(0, 10));
      } else if (city) {
        setSuggestions(getAreasForCity(city));
      }
    } finally {
      setIsLoading(false);
    }
  }, [type, city]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (showSuggestions) {
        fetchSuggestions(inputValue);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, fetchSuggestions, showSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setShowSuggestions(true);
  };

  const handleSelect = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    setShowSuggestions(true);
    fetchSuggestions(inputValue);
  };

  const defaultPlaceholder = type === 'city' 
    ? "Search city or district..." 
    : "Search area...";

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder || defaultPlaceholder}
          className="pl-10"
          disabled={disabled}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-48 overflow-auto">
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion}-${index}`}
                onClick={() => handleSelect(suggestion)}
                className="px-4 py-2 hover:bg-muted cursor-pointer text-sm text-foreground flex items-center gap-2"
              >
                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestions && !isLoading && suggestions.length === 0 && inputValue && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 p-3 text-sm text-muted-foreground">
          No matches found. You can still use "{inputValue}"
        </div>
      )}
    </div>
  );
}
