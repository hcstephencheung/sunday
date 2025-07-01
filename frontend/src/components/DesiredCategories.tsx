import { Cross1Icon, PlusIcon } from '@radix-ui/react-icons';
import { Box, IconButton, TextField, Tooltip } from '@radix-ui/themes';
import React from 'react';

const DesiredCategories: React.FC<{
    categories: string[];
    onCategoriesUpdate: (categories: string[]) => void;
    showAddCategoriesInput?: boolean;
}> = ({ categories, onCategoriesUpdate, showAddCategoriesInput = false }) => {
    const [input, setInput] = React.useState('');

    const handleRemove = (idx: number) => {
        const newArr = categories.filter((_, i) => i !== idx);
        onCategoriesUpdate(Array.from(new Set(newArr)));
    };

    const handleRemoveAll = () => {
        onCategoriesUpdate([]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const addCategory = () => {
        const sanitizedInput = input.trim().toLowerCase();
        onCategoriesUpdate(Array.from(new Set([...categories, sanitizedInput])));
        setInput('');
    }

    const handleAddCategory = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        addCategory();
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && input.trim()) {
            addCategory();
        }
    };

    return (
        <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-2">
                {categories.map((cat, idx) => (
                    <span key={cat} className="inline-flex items-center bg-(--sand) rounded px-2 py-1 text-sm">
                        {cat}
                        <IconButton variant="ghost" size="1" ml="2" onClick={() => handleRemove(idx)} color="crimson">
                            <Cross1Icon />
                        </IconButton>
                    </span>
                ))}
            </div>
            {showAddCategoriesInput && (
                <Box width="100%" maxWidth="760px" minWidth="100px">
                    <TextField.Root placeholder="Add category..." value={input} onChange={handleInputChange} onKeyDown={handleInputKeyDown}>
                        <TextField.Slot pr="3">
                            <IconButton variant="ghost" onClick={handleAddCategory} disabled={!input.trim()}>
                                <PlusIcon />
                            </IconButton>
                        </TextField.Slot>
                        <TextField.Slot>
                            <Tooltip content="Clear all">
                                <IconButton variant="ghost" onClick={handleRemoveAll} color="crimson">
                                    <Cross1Icon />
                                </IconButton>
                            </Tooltip>
                        </TextField.Slot>
                    </TextField.Root>
                </Box>
            )}
        </div >
    );
};

export default DesiredCategories;
