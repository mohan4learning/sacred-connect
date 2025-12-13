import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  name: string;
  type: 'purohit' | 'service';
  subtitle?: string;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function SearchAutocomplete({
  value,
  onChange,
  onSearch,
  placeholder = "Search pooja or purohit...",
  className,
  inputClassName,
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
    const fetchSuggestions = async () => {
      if (value.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      const query = value.toLowerCase();

      // Fetch purohits and services in parallel
      const [purohitsRes, servicesRes] = await Promise.all([
        supabase
          .from('purohits')
          .select('id, full_name, city')
          .or(`full_name.ilike.%${query}%,city.ilike.%${query}%`)
          .limit(5),
        supabase
          .from('pooja_services')
          .select('id, name')
          .ilike('name', `%${query}%`)
          .limit(5),
      ]);

      const results: Suggestion[] = [];

      if (servicesRes.data) {
        servicesRes.data.forEach((s) => {
          results.push({
            id: s.id,
            name: s.name,
            type: 'service',
          });
        });
      }

      if (purohitsRes.data) {
        purohitsRes.data.forEach((p) => {
          results.push({
            id: p.id,
            name: p.full_name,
            type: 'purohit',
            subtitle: p.city,
          });
        });
      }

      setSuggestions(results);
      setLoading(false);
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [value]);

  const handleSelect = (suggestion: Suggestion) => {
    setShowSuggestions(false);
    if (suggestion.type === 'purohit') {
      navigate(`/purohits/${suggestion.id}`);
    } else {
      onChange(suggestion.name);
      navigate(`/purohits?search=${encodeURIComponent(suggestion.name)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      onSearch();
    }
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        className={cn("pl-12", inputClassName)}
      />

      {showSuggestions && (value.trim().length >= 2 || suggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-64 overflow-auto text-foreground">
          {loading ? (
            <div className="p-3 text-sm text-muted-foreground text-center">Searching...</div>
          ) : suggestions.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">No results found</div>
          ) : (
            <ul className="py-1">
              {suggestions.map((suggestion) => (
                <li
                  key={`${suggestion.type}-${suggestion.id}`}
                  onClick={() => handleSelect(suggestion)}
                  className="px-4 py-2.5 hover:bg-muted cursor-pointer flex items-center gap-3"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    suggestion.type === 'service' ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                  )}>
                    {suggestion.type === 'service' ? (
                      <Sparkles className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{suggestion.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.type === 'service' ? 'Pooja Service' : suggestion.subtitle}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
