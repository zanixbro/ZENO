
import React, { useState } from 'react';
import { PageID, MenuGroup } from '../../types';
import { MENU_ITEMS } from '../../constants';
import { ChevronDownIcon } from '../icons';

interface SidebarProps {
    activePage: PageID;
    onNavigate: (page: PageID) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
    const [openCategories, setOpenCategories] = useState<string[]>(MENU_ITEMS.map(g => g.category));

    const toggleCategory = (category: string) => {
        setOpenCategories(prev =>
            prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
        );
    };

    return (
        <aside className="w-64 bg-zeno-header flex-shrink-0 flex flex-col border-r border-zeno-accent/10">
            <div className="h-16 flex items-center justify-center border-b border-zeno-accent/10">
                <span className="text-2xl font-bold text-zeno-accent">Zeno</span>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-4">
                {MENU_ITEMS.map((group) => (
                    <div key={group.category}>
                        <button
                            onClick={() => toggleCategory(group.category)}
                            className="w-full flex justify-between items-center text-left text-xs font-bold uppercase text-zeno-muted/50 hover:text-zeno-muted"
                        >
                            {group.category}
                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${openCategories.includes(group.category) ? 'rotate-180' : ''}`} />
                        </button>
                        {openCategories.includes(group.category) && (
                            <div className="mt-2 space-y-1">
                                {group.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => onNavigate(item.id)}
                                        className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 text-left
                                            ${activePage === item.id
                                                ? 'bg-zeno-accent text-zeno-bg shadow-lg shadow-zeno-accent/20'
                                                : 'text-zeno-muted hover:bg-zeno-hover hover:text-white'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                                        <span>{item.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
