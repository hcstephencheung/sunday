import React, { useCallback, useEffect, useState } from 'react';
import { Table } from '@radix-ui/themes';
import TypeableSelect, { TypeableSelectOption } from './TypeableSelect';
import { CategorizedLineItem, UNCATEGORIZED } from '../pages/Csv/types';
import { parseDateString } from '../pages/Csv/utils';
import { isEqual, noop } from 'lodash';

interface LineItem {
    date: string;
    description: string;
    debit: boolean;
    amount: number;
    category?: string; // Optional category for classification
}

const hasCategory = (lineItem: LineItem): boolean => {
    return !!(lineItem.category && lineItem.category !== '');
}

interface LineItemTableProps {
    lineItems: LineItem[] | CategorizedLineItem[]
    updateLineItem?: (newLineItem: CategorizedLineItem, idx: number) => void,
    categories?: string[]
    onCategoriesChange?: (categories: string[]) => void
}
const LineItemTable = ({
    lineItems,
    updateLineItem,
    categories = [],
    onCategoriesChange = () => noop
}: LineItemTableProps) => {
    const options = categories.map(category => ({
        label: category,
        value: category
    }))

    const handleOnOptionsChange = useCallback((options: TypeableSelectOption[]) => {
        const newCategorySet = new Set<string>();

        for (const option of options) {
            newCategorySet.add(option.value);
        }

        const newCategories = Array.from(newCategorySet);

        if (!isEqual(categories, newCategories)) {
            onCategoriesChange(newCategories);
        }
    }, [categories, onCategoriesChange]);

    const handleSelectedCategoryChange = useCallback((lineItem: CategorizedLineItem, idx: number, value: string) => {
        const newLineItem = {
            ...lineItem,
            category: value
        };
        if (typeof updateLineItem === 'function') {
            updateLineItem(newLineItem, idx)
        }
    }, [updateLineItem]);

    return (
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeaderCell className="px-4">Date</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="px-4">Description</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="px-4">Type</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="px-4">Amount</Table.ColumnHeaderCell>
                    {hasCategory(lineItems[0]) && <Table.ColumnHeaderCell className="px-4">Category</Table.ColumnHeaderCell>}
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {lineItems.map((lineItem, idx) => (
                    <Table.Row key={idx}>
                        <Table.Cell className="px-4">{parseDateString(lineItem.date)}</Table.Cell>
                        <Table.Cell className="px-4">{lineItem.description}</Table.Cell>
                        <Table.Cell className="px-4">{lineItem.debit ? 'Debit' : 'Credit'}</Table.Cell>
                        <Table.Cell className="px-4">{lineItem.amount}</Table.Cell>
                        {hasCategory(lineItem) && <Table.Cell className="px-4">
                            <TypeableSelect
                                options={options}
                                defaultOption={{ label: lineItem.category, value: lineItem.category } as TypeableSelectOption}
                                onOptionsChange={handleOnOptionsChange}
                                onSelectedOptionChange={(value) => handleSelectedCategoryChange(lineItem as CategorizedLineItem, idx, value)}
                                triggerClassNames={lineItem.category === UNCATEGORIZED ?
                                    ['bg-(--red-9)', 'text-white'] : ['bg-(--accent-9)', 'text-white']}
                            />
                        </Table.Cell>}
                    </Table.Row>
                ))}
            </Table.Body>
        </Table.Root>
    );
}

export default LineItemTable;
