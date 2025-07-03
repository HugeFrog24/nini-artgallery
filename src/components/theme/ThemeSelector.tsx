'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { ACCENT_COLORS, AccentColor } from '@/types/theme';
import { SwatchIcon } from '@heroicons/react/24/outline';

export default function ThemeSelector() {
  const { theme, setAccentColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const handleColorSelect = (color: AccentColor) => {
    setAccentColor(color);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Theme selector button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-accent-500 shadow-lg rounded-full p-3 border border-accent-600 hover:bg-accent-600 hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
        aria-label="Change theme colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <SwatchIcon className="h-6 w-6 text-white" />
      </button>

      {/* Color selection dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[160px] animate-in slide-in-from-bottom-2 duration-200"
          role="menu"
          aria-label="Theme color options"
        >
          <div className="text-sm font-medium text-gray-700 mb-3 px-1">
            Choose accent color
          </div>
          
          <div className="space-y-1">
            {Object.entries(ACCENT_COLORS).map(([colorKey, colorInfo]) => {
              const color = colorKey as AccentColor;
              const isSelected = theme.accent === color;
              
              return (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                    isSelected
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  role="menuitem"
                  aria-current={isSelected ? 'true' : 'false'}
                >
                  {/* Color preview circle */}
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: colorInfo.preview }}
                    aria-hidden="true"
                  />
                  
                  <span className="flex-1 text-left">{colorInfo.name}</span>
                  
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="w-2 h-2 bg-gray-600 rounded-full flex-shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}