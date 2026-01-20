import React, { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ContactSearchableSelect = ({ 
  label, 
  useSearchHook, 
  onSelect, 
  value,
  disabled = false,
  error = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  const { data: searchData, isFetching } = useSearchHook(searchTerm, {
    skip: !searchTerm || searchTerm.length < 2,
  });

  const contacts = searchData?.results || [];

  useEffect(() => {
    if (value) {
      setSearchTerm(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelect = (contact) => {
    if (!contact) return;

    // Set input text to the chosen name
    const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
    setSearchTerm(fullName);
    setShowSuggestions(false);

    onSelect(contact);
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label htmlFor="contact-search">{label}</Label>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="contact-search"
            type="text"
            value={searchTerm}
            onChange={handleChange}
            onFocus={() => {
              if (searchTerm && contacts.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={`Search ${label.toLowerCase()}...`}
            disabled={disabled}
            className={cn(
              "pl-9",
              error && "border-red-500"
            )}
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && searchTerm && searchTerm.length >= 2 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {contacts.length > 0 ? (
              <div className="py-1">
                {contacts.map((contact) => {
                  const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
                  return (
                    <div
                      key={contact.id}
                      onClick={() => handleSelect(contact)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {fullName || "Unnamed Contact"}
                        </div>
                        {contact.email && (
                          <div className="text-xs text-gray-500 truncate">
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="text-xs text-gray-500 truncate">
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !isFetching && searchTerm.length >= 2 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No contacts found
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactSearchableSelect;



