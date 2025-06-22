import React, { useState } from 'react';
import { Heading, Button, Spinner, Tabs, Box, Flex, Container } from '@radix-ui/themes';
import { MagicWandIcon, ReloadIcon, SunIcon } from '@radix-ui/react-icons';
import DesiredCategories from '../../components/DesiredCategories';
import LineItemTable from '../../components/LineItemTable';
import { BB_CATEGORIES, CategorizedLineItem, DEFAULT_DESIRED_CATEGORIES, Glossary, LineItem, UNCATEGORIZED } from './types';
import { BankRadioCard, Banks, CsvTransformerByBank } from '../../components/BankRadioCard';
import { tagLineItemsWithClassification, sumCategories, sortAndSumCategories, sanitizeLineItems, santizeClassifiedItems, buildGlossary, loadTextFileAsObject, getCategoriesFromLineItems, mergePrimitiveArrayWithoutDuplicates, arrayDifference, streamPdf } from './utils';
import GlossaryTab from '../../components/GlossaryTab';
import FileUploader, { TAcceptedFileType } from '../../components/FileUploader';
import isEqual from 'lodash/isEqual';
import SumByCategoryTab from '../../components/SumByCategoryTab';
import { isEmpty } from 'lodash';
import PdfStagesGraphic, { PdfStages } from '../../components/PdfStagesGraphic';
import TotalsCard from '../../components/TotalsCard';

const CsvPage = () => {
    const params = new URLSearchParams(window.location.search);
    const isBB = params.get('bb');

    const initialCategories = isBB !== null ? BB_CATEGORIES : DEFAULT_DESIRED_CATEGORIES;
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [categorizedLineItems, setCategorizedLineItems] = useState<CategorizedLineItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [sumByCategory, setSumByCategory] = useState<Record<string, number>>({});
    const [totalSum, setTotalSum] = useState<number>(0);
    const [totalTransactions, setTotalTransactions] = useState<number>(0);
    const [classifying, setClassifying] = useState<boolean>(false);
    const [uploading, setUploading] = useState<PdfStages>(PdfStages.DONE);
    const [bank, setBank] = useState<Banks>(Banks.SCOTIABANK)
    const [glossary, setGlossary] = useState<Glossary>({});

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
        setUploading(PdfStages.UPLOADING);
        if (selectedFile && selectedFile.type === 'text/csv') {
            const reader = new FileReader();
            reader.onload = (e) => {
                setUploading(PdfStages.DONE);

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
                setUploading(PdfStages.PROCESSING);
                const pdfDataUrl = e.target?.result as string;
                const onData = (inProgressLineItems: LineItem[]) => {
                    setLineItems(inProgressLineItems);
                };
                const onCompleted = (completedLineItems: LineItem[]) => {
                    if (!isEqual(lineItems, completedLineItems)) {
                        setLineItems(completedLineItems);
                    }
                    setUploading(PdfStages.DONE);
                }
                const onError = (error: Error) => {
                    console.error('Error processing PDF:', error);
                    setUploading(PdfStages.DONE);
                    resetEverything();
                };
                streamPdf(pdfDataUrl, { onData, onError, onCompleted });
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
        const result = await fetch('/api/classify', {
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

    React.useEffect(() => {
        const lineItemsWithoutPayments = lineItems.filter(item => {
            const paymentRegex = /^(?=.*PAYMENT)(?=.*THANK)(?=.*YOU).*/is;
            const paymentTransferred = /^(?=.*PAYMENT)(?=.*FROM).*/is;
            return !paymentRegex.test(item.description) && !paymentTransferred.test(item.description);
        });
        const totalSum = lineItemsWithoutPayments.reduce((sum, item) => {
            return sum + item.amount
        }, 0);
        setTotalSum(totalSum);
        setTotalTransactions(lineItemsWithoutPayments.length);
    }, [lineItems]);

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
                    <PdfStagesGraphic stage={uploading} />
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
                            color="jade" variant="soft" radius="large"
                            onClick={handleClassifyCsvClick}
                            disabled={classifying}
                        >
                            <Spinner loading={classifying}><MagicWandIcon /></Spinner> AI Categorize
                        </Button>

                        <FileUploader
                            disabled={classifying}
                            ref={glossaryFileInputRef}
                            acceptedFileTypes={[".txt"]}
                            handleFileChanged={handleGlossaryFileChange}
                            uploadBtnText="Use previous definitions"
                            showUploadedFileName={false}
                        />
                    </>
                )}
            </Flex>

            {lineItems.length > 0 && <TotalsCard totalSum={totalSum} totalTransactions={totalTransactions} />}

            <Box width="100%" pb="6">
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
