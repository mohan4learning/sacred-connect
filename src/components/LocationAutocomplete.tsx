import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchCities, searchAreas, getCities, getAreasForCity } from "@/lib/indianLocations";

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
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (type === 'city') {
      setSuggestions(searchCities(inputValue));
    } else if (type === 'area' && city) {
      setSuggestions(searchAreas(city, inputValue));
    }
  }, [inputValue, type, city]);

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
    if (type === 'city') {
      setSuggestions(inputValue ? searchCities(inputValue) : getCities().slice(0, 10));
    } else if (type === 'area' && city) {
      setSuggestions(inputValue ? searchAreas(city, inputValue) : getAreasForCity(city).slice(0, 10));
    }
  };

  const defaultPlaceholder = type === 'city' 
    ? "Select or type city..." 
    : "Select or type area...";

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
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-48 overflow-auto">
          <ul className="py-1">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion}
                onClick={() => handleSelect(suggestion)}
                className="px-4 py-2 hover:bg-muted cursor-pointer text-sm text-foreground flex items-center gap-2"
              >
                <MapPin className="h-3 w-3 text-muted-foreground" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && inputValue && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 p-3 text-sm text-muted-foreground">
          No matches found. You can still use "{inputValue}"
        </div>
      )}
    </div>
  );
}
