import { useState, useRef, useEffect } from 'react';
import { IconChevronDown, IconCheck } from './icons';
import { useTranslation } from '../../shared/contexts/TranslationContext';

interface Category {
    id: string | number;
    name: string;
    color?: string;
}

interface CategoryFilterDropdownProps {
    categories: Category[];
    selectedCategories: (string | number)[];
    onChange: (selected: (string | number)[]) => void;
    label?: string;
    showColors?: boolean;
    colorMap?: Record<string | number, string>;
    hideSelectAll?: boolean;
}

export default function CategoryFilterDropdown({
    categories,
    selectedCategories,
    onChange,
    label,
    showColors = false,
    colorMap = {},
    hideSelectAll = false
}: CategoryFilterDropdownProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAllSelected = selectedCategories.length === categories.length;

    const handleToggleCategory = (categoryId: string | number) => {
        let newSelection: (string | number)[];
        
        if (selectedCategories.includes(categoryId)) {
            // Remove from selection (allow empty selection)
            newSelection = selectedCategories.filter(id => id !== categoryId);
        } else {
            // Add to selection
            newSelection = [...selectedCategories, categoryId];
        }
        
        onChange(newSelection);
    };

    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            // If all selected, deselect all
            onChange([]);
        } else {
            // Select all
            onChange(categories.map(c => c.id));
        }
    };

    const getDisplayText = () => {
        if (selectedCategories.length === 0) {
            return t('businessAnalytics.noneSelected') || 'None selected';
        }
        if (isAllSelected) {
            return t('businessAnalytics.allCategories');
        }
        if (selectedCategories.length === 1) {
            const cat = categories.find(c => c.id === selectedCategories[0]);
            return cat?.name || '1 selected';
        }
        return t('businessAnalytics.selectedCount')
            .replace('{{count}}', String(selectedCategories.length))
            .replace('{{total}}', String(categories.length));
    };

    const isCategorySelected = (categoryId: string | number) => {
        return selectedCategories.includes(categoryId);
    };

    const getCategoryColor = (category: Category): string | undefined => {
        if (!showColors) return undefined;
        return category.color || colorMap[category.id] || colorMap[category.name];
    };

    return (
        <div className="category-filter-dropdown" ref={dropdownRef}>
            {label && <label className="filter-label">{label}</label>}
            <button 
                className="filter-trigger"
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <span className="filter-text">{getDisplayText()}</span>
                <IconChevronDown className={`filter-icon ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div className="filter-dropdown-menu">
                    <div className="filter-search">
                        <input
                            type="text"
                            placeholder={t('common.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>

                    <div className="filter-options">
                        {/* Select All option - hidden when hideSelectAll is true */}
                        {!hideSelectAll && (
                            <>
                                <label className={`filter-option select-all-option ${isAllSelected ? 'selected' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleToggleSelectAll}
                                    />
                                    <span className="checkbox-custom">
                                        {isAllSelected && <IconCheck />}
                                    </span>
                                    <span className="option-name">{t('businessAnalytics.selectAll')}</span>
                                </label>
                                <div className="filter-divider" />
                            </>
                        )}

                        {filteredCategories.map(category => {
                            const color = getCategoryColor(category);
                            return (
                                <label 
                                    key={category.id} 
                                    className={`filter-option ${isCategorySelected(category.id) ? 'selected' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isCategorySelected(category.id)}
                                        onChange={() => handleToggleCategory(category.id)}
                                    />
                                    <span 
                                        className="checkbox-custom"
                                        style={color ? { borderColor: color, background: isCategorySelected(category.id) ? color : 'transparent' } : undefined}
                                    >
                                        {isCategorySelected(category.id) && <IconCheck />}
                                    </span>
                                    {color && (
                                        <span 
                                            className="option-color-dot" 
                                            style={{ background: color }}
                                        />
                                    )}
                                    <span 
                                        className="option-name"
                                        style={color ? { color } : undefined}
                                    >
                                        {category.name}
                                    </span>
                                </label>
                            );
                        })}
                        {filteredCategories.length === 0 && (
                            <div className="no-results">
                                {t('common.noResults') || 'No categories found'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
