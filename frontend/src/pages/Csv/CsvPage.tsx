import React, { useState } from 'react';
import { Heading, Button, Spinner, Tabs, Box, Flex, Container, Section } from '@radix-ui/themes';
import { FilePlusIcon, MagicWandIcon, ReloadIcon, SunIcon } from '@radix-ui/react-icons';
import DesiredCategories from '../../components/DesiredCategories';
import LineItemTable from '../../components/LineItemTable';
import DataTable from '../../components/DataTable';
import { BB_CATEGORIES, CategorizedLineItem, DEFAULT_DESIRED_CATEGORIES, Glossary, LineItem, UNCATEGORIZED } from './types';
import { BankRadioCard, Banks, CsvTransformerByBank } from '../../components/BankRadioCard';
import { tagLineItemsWithClassification, sumCategories, sortAndSumCategories, exportSumsToCsv, sanitizeLineItems, santizeClassifiedItems, buildGlossary, loadTextFileAsObject, getCategoriesFromLineItems, mergePrimitiveArrayWithoutDuplicates, arrayDifference } from './utils';
import GlossaryTab from '../../components/GlossaryTab';
import FileUploader, { TAcceptedFileType } from '../../components/FileUploader';
import isEqual from 'lodash/isEqual';
import SumByCategoryTab from '../../components/SumByCategoryTab';
import { isEmpty } from 'lodash';

const test = [
    {
        "date": "2025-03-19",
        "description": "PAYMENT THANK YOU/PAIEMENT MERCI",
        "amount": -1100,
        "confidence": "0.99",
        "reason": "Clearly labeled as payment in the payments table; negative for credit."
    },
    {
        "date": "2025-03-31",
        "description": "PAYMENT THANK YOU/PAIEMENT MERCI",
        "amount": -200,
        "confidence": "0.99",
        "reason": "Clearly labeled as payment in the payments table; negative for credit."
    },
    {
        "date": "2025-03-17",
        "description": "COSTCO WHOLESALE W51 BURNABY BC",
        "amount": 101,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-20",
        "description": "McDonalds 1449 COQUITLAM BC",
        "amount": 1.84,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-21",
        "description": "McDonalds 1449 COQUITLAM BC",
        "amount": 1.84,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-22",
        "description": "COSTCO WHOLESALE W51 BURNABY BC",
        "amount": 73.31,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-23",
        "description": "McDonalds 1449 COQUITLAM BC",
        "amount": 1.05,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-23",
        "description": "LS Singapore Hawker Coquitlam BC",
        "amount": 52.53,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-25",
        "description": "DRIVER SERVICES CENTRE BURNABY BC",
        "amount": 75,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-26",
        "description": "SQ *ROCKY POINT ICE CR Port Moody BC",
        "amount": 10.11,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-28",
        "description": "FLAMING WOK VANCOUVER BC",
        "amount": 17.85,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-29",
        "description": "McDonalds 1449 COQUITLAM BC",
        "amount": 1.58,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-29",
        "description": "BODY ENERGY CLUB COQUITLAM BC",
        "amount": 12.7,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-30",
        "description": "AFANG LITTLE BASKET BA BURNABY BC",
        "amount": 45.64,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-30",
        "description": "ABC*30916-CLUB16 COQUITLAM BC",
        "amount": 23.08,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-30",
        "description": "BURGER KING #14160 BURNABY BC",
        "amount": 4.71,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-30",
        "description": "MCDONALD'S #1449 COQUITLAM BC",
        "amount": 1.05,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-31",
        "description": "MISAKO METROTOWN BURNABY BC",
        "amount": 57.96,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-03-31",
        "description": "MCDONALD'S #1449 COQUITLAM BC",
        "amount": 1.05,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-04-01",
        "description": "AIRALO SINGAPORE",
        "amount": 12,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-04-01",
        "description": "SQ *PHILZ COFFEE Sunnyvale CA (6.61 USD @ 1.475037821)",
        "amount": 9.75,
        "confidence": "0.99",
        "reason": "Foreign currency transaction, amount and conversion clear."
    },
    {
        "date": "2025-04-02",
        "description": "SQ *PHILZ COFFEE Cupertino CA (6.61 USD @ 1.476550680)",
        "amount": 9.76,
        "confidence": "0.99",
        "reason": "Foreign currency transaction, amount and conversion clear."
    },
    {
        "date": "2025-04-02",
        "description": "LA CUEVA MEX GRILL SARATOGA CA (36.83 USD @ 1.477599782)",
        "amount": 54.42,
        "confidence": "0.99",
        "reason": "Foreign currency transaction, amount and conversion clear."
    },
    {
        "date": "2025-04-02",
        "description": "SQ *BLUE BOTTLE COFFEE San Jose CA (9.00 USD @ 1.470000000)",
        "amount": 13.23,
        "confidence": "0.99",
        "reason": "Foreign currency transaction, amount and conversion clear."
    },
    {
        "date": "2025-04-02",
        "description": "CRUMBL CUPERTINO LINDON UT (9.99 USD @ 1.469469469)",
        "amount": 14.68,
        "confidence": "0.99",
        "reason": "Foreign currency transaction, amount and conversion clear."
    },
    {
        "date": "2025-04-03",
        "description": "SQ *PHILZ COFFEE Cupertino CA (7.02 USD @ 1.470085470)",
        "amount": 10.32,
        "confidence": "0.99",
        "reason": "Foreign currency transaction, amount and conversion clear."
    },
    {
        "date": "2025-04-03",
        "description": "TST* SALT AND STRAW - SANTA CLARA CA (26.90 USD @ 1.470260223)",
        "amount": 39.55,
        "confidence": "0.99",
        "reason": "Foreign currency transaction, amount and conversion clear."
    },
    {
        "date": "2025-04-03",
        "description": "TARGET 00003236 CUPERTINO CA (9.05 USD @ 1.469613259)",
        "amount": 13.3,
        "confidence": "0.99",
        "reason": "Foreign currency transaction, amount and conversion clear."
    },
    {
        "date": "2025-04-03",
        "description": "TARGET 00003236 CUPERTINO CA (3.54 USD @ 1.468926553)",
        "amount": 5.2,
        "confidence": "0.99",
        "reason": "Foreign currency transaction, amount and conversion clear."
    },
    {
        "date": "2025-04-04",
        "description": "TST* PARIS BAGUETTE - CUPERTINO CA (9.57 USD @ 1.471264367)",
        "amount": 14.08,
        "confidence": "0.99",
        "reason": "Foreign currency transaction, amount and conversion clear."
    },
    {
        "date": "2025-04-06",
        "description": "COSTCO WHOLESALE W51 BURNABY BC",
        "amount": 139.6,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-04-08",
        "description": "McDonalds 1449 COQUITLAM BC",
        "amount": 1.58,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-04-09",
        "description": "AMATO GELATO CAFE VANCOUVER BC",
        "amount": 5.46,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-04-11",
        "description": "NADRI RESTAURANT BURNABY BC",
        "amount": 77.28,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-04-12",
        "description": "BODY ENERGY CLUB VANCOUVER BC",
        "amount": 10.58,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-04-13",
        "description": "COSTCO WHOLESALE W51 BURNABY BC",
        "amount": 102.28,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    },
    {
        "date": "2025-04-13",
        "description": "ABC*30916-CLUB16 COQUITLAM BC",
        "amount": 23.08,
        "confidence": "0.99",
        "reason": "Standard purchase, date and amount clear."
    }
];

const CsvPage = () => {
    const params = new URLSearchParams(window.location.search);
    const isBB = params.get('bb');

    const initialCategories = isBB !== null ? BB_CATEGORIES : DEFAULT_DESIRED_CATEGORIES;
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [categorizedLineItems, setCategorizedLineItems] = useState<CategorizedLineItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [sumByCategory, setSumByCategory] = useState<Record<string, number>>({});
    const [classifying, setClassifying] = useState<boolean>(false);
    const [bank, setBank] = useState<Banks>(Banks.SCOTIABANK)
    const [glossary, setGlossary] = useState<Glossary>({})

    const uploadedFileInputRef = React.useRef<HTMLInputElement | null>(null);
    const glossaryFileInputRef = React.useRef<HTMLInputElement | null>(null);

    const resetEverything = () => {
        setLineItems([]);
        setCategorizedLineItems([]);
        setSumByCategory({});
        setGlossary({});
    };

    const handleUploadedFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        resetEverything();

        const selectedFile = event.target.files?.[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                const rows = text.split('\n').map(row => row.split(','));
                const items = CsvTransformerByBank[bank](rows);

                setLineItems(items);
            };
            reader.readAsText(selectedFile);
        }
        else if (selectedFile && selectedFile.type === 'application/pdf') {
            // Handle PDF upload
            const reader = new FileReader();
            reader.onload = (e) => {
                const pdfDataUrl = e.target?.result as string;
                // You can handle the PDF data URL here if needed
                const formData = new FormData();
                formData.append('pdf_base64', pdfDataUrl);
                fetch('/api/csv/pdf', {
                    method: 'POST',
                    body: formData,
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log('PDF uploaded successfully:', data);
                        const lineItems = data.items.map(item => ({
                            date: item.date,
                            description: item.description,
                            amount: parseFloat(item.amount),
                        }))
                        setLineItems(lineItems);
                    })
                    .catch(error => console.error('Error uploading PDF:', error));
            }
            reader.readAsDataURL(selectedFile);
        } else {
            console.error('Please upload a valid CSV or PDF file.');
        }
    };

    const handleGlossaryFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile && selectedFile.type === 'text/plain') {
            const uploadedGlossary = await loadTextFileAsObject(selectedFile);
            // merge the uploaded glossary with current
            const newGlossary = Object.assign({}, glossary, uploadedGlossary);

            const sanitizedLineItems = sanitizeLineItems(lineItems);
            const sanitizedClassifiedItems = santizeClassifiedItems(newGlossary);
            const taggedLineItems = tagLineItemsWithClassification(sanitizedLineItems, sanitizedClassifiedItems);
            setCategorizedLineItems(taggedLineItems);

            const categories = getCategoriesFromLineItems(taggedLineItems);
            const previousCategories = Object.entries(sanitizedClassifiedItems).map(([_, category]) => category);
            const newCategories = mergePrimitiveArrayWithoutDuplicates(categories, previousCategories);
            setCategories(newCategories);
            setGlossary(newGlossary);
        } else {
            console.error('Please upload a valid txt file.');
        }
    }

    const handleClassifyCsvClick = async () => {
        setClassifying(true);

        const sanitizedLineItems = sanitizeLineItems(lineItems);

        // Prepare req data
        const requestBody = {
            line_items: sanitizedLineItems,
            desired_categories: isEmpty(categories) ? initialCategories : categories,
        }

        // make the API call
        const result = await fetch('/api/csv/classify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        if (result.ok) {
            const classifiedData = await result.json();
            const aiClassifiedItems = santizeClassifiedItems(classifiedData.classified_items);

            // merge ai classified items to existing glossary if we already have one
            const newGlossary = Object.assign({}, glossary, aiClassifiedItems);

            const taggedLineItems = tagLineItemsWithClassification(sanitizedLineItems, newGlossary);
            const categories = getCategoriesFromLineItems(taggedLineItems);

            setCategorizedLineItems(taggedLineItems);
            setCategories(categories);
        }
        setClassifying(false);
    };

    const updateLineItem = React.useCallback((newLineItem: CategorizedLineItem, idx: number) => {
        const previousLineItem = categorizedLineItems[idx];
        if (!previousLineItem.category || !newLineItem.category) {
            console.error('Cannot update categorized line item without category');
            return;
        }

        const newCategorizedLineItems = [...categorizedLineItems];
        newCategorizedLineItems[idx] = newLineItem;
        setCategorizedLineItems(newCategorizedLineItems);

        const newCategories = getCategoriesFromLineItems(newCategorizedLineItems);
        // i think we can only add new categories?
        const mergedCategories = mergePrimitiveArrayWithoutDuplicates(categories, newCategories);

        setCategories(mergedCategories);
    }, [categories, categorizedLineItems]);

    const handleCategoriesChanged = React.useCallback((newCategories: string[]) => {
        // TODO: some validation?
        const deletedItems = arrayDifference(categories, newCategories);

        // if we removed some categories, we might need to update line items too
        if (deletedItems.length > 0) {
            const newCategorizedLineItems = [...categorizedLineItems];
            let hasModified = false;
            for (const deletedItem of deletedItems) {
                newCategorizedLineItems.forEach((lineItem) => {
                    if (lineItem.category === deletedItem) {
                        lineItem.category = UNCATEGORIZED;
                        hasModified = true;
                    }
                });
            }

            if (hasModified) {
                setCategorizedLineItems(newCategorizedLineItems);
            }
        }

        setCategories(newCategories);
    }, [categories, categorizedLineItems]);

    // Effect to update data points when categorizedLineItems changes
    // could change from AI categorization or user updates
    React.useEffect(() => {
        if (categorizedLineItems.length === 0) {
            return;
        }

        const newGlossary = buildGlossary(categorizedLineItems, glossary);
        if (!isEqual(glossary, newGlossary)) {
            // only update glossary if it changed to avoid infinite loop
            setGlossary(newGlossary);
        }

        // always re-sort and re-sum the categories
        const summedCategories = sumCategories(categorizedLineItems);
        const roundedSummedCategories = sortAndSumCategories(summedCategories);
        setSumByCategory(roundedSummedCategories);
    }, [categorizedLineItems, glossary]);

    // Handler for PDF upload
    const handleUploadPDFChanged = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            const formData = new FormData();
            formData.append('pdf', selectedFile);
            try {
                const response = await fetch('/api/csv/pdf', {
                    method: 'POST',
                    body: formData,
                });
                if (!response.ok) {
                    throw new Error('Failed to upload PDF');
                }
                // Optionally handle response here
            } catch (error) {
                console.error(error);
            }
        } else {
            console.error('Please upload a valid PDF file.');
        }
    };

    return (
        <Container width="100%" height="100%" p="4">
            <Heading as="h1" size="6" weight="light" mb="8">
                <Flex gap="1" align="center">
                    Sunday, the budgeting day <SunIcon />
                </Flex>
            </Heading>

            <Box width="100%">
                <Box>
                    <BankRadioCard
                        bank={bank}
                        setBank={setBank}
                    />
                </Box>

                <Box my="4">
                    <Flex gap="2" align="center" mb="4">
                        <FileUploader
                            ref={uploadedFileInputRef}
                            acceptedFileTypes={['.csv', '.pdf'] as TAcceptedFileType[]}
                            handleFileChanged={handleUploadedFileChange}
                            uploadBtnText="Upload CSV or PDF"
                            showUploadedFileName
                        />
                    </Flex>
                </Box>
            </Box>

            <Heading as="h3" my="4">Your credit card statement</Heading>
            <Flex gap="2" width="100%" wrap="wrap">
                <Button onClick={() => resetEverything()} color="tomato">
                    <ReloadIcon /> Start over
                </Button>
                {lineItems.length > 0 && (
                    <>
                        <Button
                            color="indigo" variant="soft" radius="large"
                            onClick={handleClassifyCsvClick}
                            disabled={classifying}
                        >
                            <Spinner loading={classifying}><MagicWandIcon /></Spinner> AI Categorize
                        </Button>

                        <FileUploader
                            disabled={classifying}
                            ref={glossaryFileInputRef}
                            acceptedFileType=".txt"
                            handleFileChanged={handleGlossaryFileChange}
                            uploadBtnText="Use previous definitions"
                            showUploadedFileName={false}
                        />
                    </>
                )}
            </Flex>

            <Box width="100%">
                {/* Summed categories */}
                {Object.keys(sumByCategory).length <= 0 ?
                    lineItems.length > 0 && <LineItemTable lineItems={lineItems} />
                    : (
                        <Tabs.Root defaultValue="LineItems" my="4">
                            <Tabs.List>
                                <Tabs.Trigger value="LineItems">Line Items</Tabs.Trigger>
                                <Tabs.Trigger value="Categories">Categories</Tabs.Trigger>
                                <Tabs.Trigger value="SumByCategory">Sum By Category</Tabs.Trigger>
                                <Tabs.Trigger value="Glossary">Glossary</Tabs.Trigger>
                            </Tabs.List>

                            <Box overflow="scroll" my="4">
                                <Tabs.Content value="LineItems">
                                    <LineItemTable
                                        lineItems={categorizedLineItems}
                                        updateLineItem={updateLineItem}
                                        categories={categories}
                                        onCategoriesChange={handleCategoriesChanged}
                                    />
                                </Tabs.Content>

                                <Tabs.Content value="Categories">
                                    <Box width="100%">
                                        <DesiredCategories categories={categories} onCategoriesUpdate={handleCategoriesChanged} />
                                    </Box>
                                </Tabs.Content>

                                <Tabs.Content value="SumByCategory">
                                    <SumByCategoryTab data={sumByCategory} />
                                </Tabs.Content>

                                <Tabs.Content value="Glossary">
                                    <GlossaryTab
                                        glossary={glossary}
                                        categorizedLineItems={categorizedLineItems}
                                    />
                                </Tabs.Content>
                            </Box>
                        </Tabs.Root>
                    )}
            </Box>
        </Container>
    )
}

export default CsvPage;