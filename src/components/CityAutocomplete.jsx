import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

const CityAutocomplete = ({ value, onSelect, placeholder = "Search city..." }) => {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        // Click outside to close
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleInputChange = async (e) => {
        const val = e.target.value;
        setQuery(val);

        // Allow clearing the value
        if (val === '') {
            onSelect('');
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        if (val.length > 2) {
            setLoading(true);
            try {
                const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${val}&type=municipality&limit=5`);
                const data = await response.json();

                if (data.features) {
                    const formattedSuggestions = data.features.map(f => ({
                        label: `${f.properties.label} (${f.properties.postcode})`,
                        value: f.properties.label, // Storing just the city name or label as preferred
                        context: f.properties.context
                    }));
                    setSuggestions(formattedSuggestions);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Error fetching cities:", error);
            } finally {
                setLoading(false);
            }
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (item) => {
        setQuery(item.value);
        onSelect(item.value);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none transition-all"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                </div>
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((item, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelect(item)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm transition-colors flex flex-col"
                        >
                            <span className="font-medium">{item.label}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{item.context}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CityAutocomplete;
