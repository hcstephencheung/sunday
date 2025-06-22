import { CategorizedLineItem, ClassifiedItem, FILE_DELIMITER, Glossary, LineItem, UNCATEGORIZED } from "../types";
import { DELTA_COMPLETED_SEPARATER, EVENT_DELIMITER } from "./WebSocketEventProxy";

export const _removeQuotes = (str: string): string => {
    const result = str.replace(/^\"/, '').replace(/\"$/, ''); // Clean up quotes if present
    return result
}

export const transformTdCsvToLineItem = (csvData: string[][]): LineItem[] => {
    return csvData.reduce((result, row) => {
        if (row.length >= 5) {
            const date = _removeQuotes(row[0]?.replace(/-/g, ''));
            const description = _removeQuotes(row[1]?.trim());
            const debit = _removeQuotes(row[2]?.trim()) !== '';
            const amountIdx = debit ? 2 : 3;
            const amount = parseFloat(row[amountIdx]?.replace(/[^0-9.-]+/g, ''));

            if (date && description && !isNaN(amount)) {
                result.push({ date, description, debit, amount });
            }
        }
        return result;
    }, [] as LineItem[]);
};

export const transformCibcCsvToLineItem = (csvData: string[][]): LineItem[] => {
    return csvData.reduce((result, row) => {
        if (row.length >= 5) {
            if (row.length === 5) {
                const date = _removeQuotes(row[0]?.replace(/-/g, ''));
                const description = _removeQuotes(row[1]?.trim());
                const debit = _removeQuotes(row[2]?.trim()) !== '';
                const amountIdx = debit ? 2 : 3;
                const amount = parseFloat(row[amountIdx]);

                if (date && description && !isNaN(amount)) {
                    result.push({ date, description, debit, amount });
                }
            }
            else if (row.length === 6) {
                // description contained a comma
                const date = _removeQuotes(row[0]?.replace(/-/g, ''));
                const firstDescription = _removeQuotes(row[1]?.trim());
                const secondDescription = _removeQuotes(row[2]?.trim());
                const description = `${firstDescription} ${secondDescription}`;
                const debit = _removeQuotes(row[3]?.trim()) !== '';
                const amountIdx = debit ? 3 : 4;
                const amount = parseFloat(row[amountIdx]);

                if (date && description && !isNaN(amount)) {
                    result.push({ date, description, debit, amount });
                }
            }
        }
        return result;
    }, [] as LineItem[]);
};

export const transformScotiabankCsvToLineItem = (csvData: string[][]): LineItem[] => {
    return csvData.reduce((result, row) => {
        if (row.length >= 6) {
            const date = _removeQuotes(row[1]?.replace(/-/g, ''));
            const description = _removeQuotes(row[2]?.trim());
            // in most cases providing more info to AI results in worse classification
            // const subDescription = _removeQuotes(row[3]?.trim());
            const debit = row[5]?.toLowerCase().includes('debit');
            const amount = parseFloat(row[6]?.replace(/[^0-9.-]+/g, ''));

            if (date && description && !isNaN(amount)) {
                result.push({ date, description, debit, amount });
            }
        }
        return result;
    }, [] as LineItem[]);
};

export const tagLineItemsWithClassification = (lineItems: LineItem[], classifiedData: Record<string, string>): CategorizedLineItem[] => {
    return lineItems.map(item => {
        return {
            ...item,
            category: classifiedData[item.description] || UNCATEGORIZED // AI sometimes doesn't classify uncategorized by default
        };
    });
}

export const getCategoriesFromLineItems = (categorizedLineItems: CategorizedLineItem[]) => {
    const categorySet = new Set<CategorizedLineItem['category']>();
    for (const item of categorizedLineItems) {
        categorySet.add(item.category);
    }

    return Array.from(categorySet);
}

export const mergePrimitiveArrayWithoutDuplicates = <T>(arr1: T[], arr2: T[]): T[] => {
    const newSet = new Set<T>([...arr1, ...arr2]);
    return Array.from(newSet);
};

export const arrayDifference = <T>(biggerArray: T[], smallerArray: T[]): T[] => {
  return biggerArray.filter(item => !smallerArray.includes(item));
}

export const sumCategories = (lineItems: Array<CategorizedLineItem>): Record<string, number> => {
    return lineItems.reduce((acc, item) => {
        const category = item.category;
        acc[category] = (acc[category] || 0) + (item.amount * (item.debit ? 1 : -1));
        return acc;
    }, {} as Record<string, number>);
};

export const sortAndSumCategories = (summedCategories: Record<string, number>): Record<string, number> => {
    let roundedSummedCategories: Record<string, number> =
        Object.keys(summedCategories)
            // sort categories alphabetically, case-insensitive
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
            // create a new object with sorted categories
            .reduce((obj, key) => {
                obj[key] = summedCategories[key];
                return obj;
            }, {} as Record<string, number>);
    for (const category in summedCategories) {
        roundedSummedCategories[category] = parseFloat(summedCategories[category].toFixed(2)); // Round to 2 decimal places
    }

    return roundedSummedCategories;
}

export const buildGlossary = (categorizedLineItems: CategorizedLineItem[], currentGlossary: Glossary) => {
    let glossary = {} as Glossary;
    for (const item of categorizedLineItems) {
        glossary[item.description] = item.category;
    }
    const mergedGlossary = Object.assign({}, currentGlossary, glossary);
    return mergedGlossary;
}

const EXPORT_FILE_NAME = 'category_sums.csv';
export const exportSumsToCsv = (sumByCategory: Record<string, number>, filename = EXPORT_FILE_NAME) => {
    const csvContent = Object.entries(sumByCategory)
        .map(([category, sum]) => `${category},${sum.toFixed(2)}`)
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export const sanitizeLineItems = (lineItems: LineItem[]) => {
    return lineItems.map(lineItem => ({
        ...lineItem,
        description: lineItem.description.toLowerCase()
    }))
}

export const santizeClassifiedItems = (classifiedItems: ClassifiedItem) => {
    const sanitizedItems: Record<string, string> = {};
    Object.entries(classifiedItems).forEach(([description, category]) => {
        sanitizedItems[`${description.toLowerCase()}`] = category.toLowerCase();
    });

    return sanitizedItems;
}

export const saveObjectAsTextFile = (obj: Record<string, string>, filename = 'smartbud_glossary.txt') => {
    // Validation: not empty, all keys and values are strings
    const keys = Object.keys(obj);
    if (keys.length === 0) {
        throw new Error('Cannot save: object is empty.');
    }
    for (const key of keys) {
        if (typeof key !== 'string' || typeof obj[key] !== 'string') {
            throw new Error(`Invalid key or value: key="${key}", value="${obj[key]}". Both must be strings.`);
        }
    }
    const content = Object.entries(obj)
        .map(([key, value]) => `${key}${FILE_DELIMITER}${value}`)
        .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export const loadTextFileAsObject = async (file: File): Promise<Record<string, string>> => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const obj: Record<string, string> = {};
    for (const line of lines) {
        const [key, value, ...rest] = line.split(FILE_DELIMITER);
        if (rest.length > 0 || key === undefined || value === undefined) {
            throw new Error(`Invalid line in glossary file: "${line}"`);
        }
        obj[key.trim().toLowerCase()] = value.trim().toLowerCase();
    }
    return obj;
};

/**
 * Parses a date string in common formats into a human-readable date.
 * Supports: YYYYMMDD, YYYY-MM-DD, YYYY/MM/DD, MM/DD/YYYY, DD/MM/YYYY
 * Returns the original string if parsing fails.
 */
export function parseDateString(dateStr: string): string {
    let year: string, month: string, day: string;

    // YYYYMMDD
    if (/^\d{8}$/.test(dateStr)) {
        year = dateStr.slice(0, 4);
        month = dateStr.slice(4, 6);
        day = dateStr.slice(6, 8);
    }
    // YYYY-MM-DD or YYYY/MM/DD
    else if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(dateStr)) {
        [year, month, day] = dateStr.split(/[-/]/);
    }
    // MM/DD/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        [month, day, year] = dateStr.split('/');
    }
    // DD/MM/YYYY
    else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        [day, month, year] = dateStr.split('-');
    }
    else {
        return dateStr;
    }

    const date = new Date(`${year}-${month}-${day}`);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const WEBSOCKET_PROTOCOL = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
export const streamPdf = async (pdfDataUrl: string, { onData, onError, onCompleted }) => {
    const formData = new FormData();
    formData.append('pdf_base64', pdfDataUrl);
    const streamId = await fetch('/api/pdf/stream', {
        method: 'POST',
        body: formData,
    });

    if (!streamId.ok) {
        throw new Error(`Failed to start PDF stream: ${streamId.statusText}`);
    }
    const id = await streamId.json();
    const ws = new WebSocket(`${WEBSOCKET_PROTOCOL}${window.location.host}/api/pdf/stream/ws?id=${id}`);

    ws.onopen = () => {
        console.log("WebSocket connection opened");
    };

    ws.onmessage = (event) => {
        if (event.data.includes(DELTA_COMPLETED_SEPARATER)) {
            const finalResult = event.data.split(DELTA_COMPLETED_SEPARATER)[1];
            const finalResultJson = JSON.parse(JSON.parse(finalResult)); // TODO, why double parse?
            // finalResultJson is in shape of openAI response
            const outputText = finalResultJson.output[0].content[0].text;
            const finalLineItems = serializeDataToLineItems(outputText);
            if (finalLineItems) {
                onCompleted(finalLineItems);
            }
            else {
                console.error("Failed to parse final result line items:", outputText);
                onError(new Error("Failed to parse final result line items"));
            }

            console.log("Regardless, websocket is closing");
        }
        else {
            const inProgressLineItems = serializeDataToLineItems(event.data);
            if (inProgressLineItems) {
                onData(inProgressLineItems);
            }
        }
    };

    ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        onError(error);
    };

    ws.onclose = () => {
        console.log("WebSocket connection closed");
    };
}

export const serializeDataToLineItems = (deltaData: string) => {
    try {
        const parsedData = JSON.parse(deltaData);
        let validatedLineItems = [];
        if (parsedData.items && Array.isArray(parsedData.items)) {
            const items = parsedData.items;
            for (const item of items) {
                if (item.date && item.description && item.amount) {
                    validatedLineItems.push({
                        date: item.date,
                        description: item.description,
                        amount: parseFloat(item.amount),
                        debit: parseFloat(item.amount) >= 0
                    } as LineItem);
                }
            }

            if (validatedLineItems.length > 0) {
                return validatedLineItems;
            }
        }
    } catch (e) {
        console.log('Error parsing JSON data:', e);
        return false;
    }
}
