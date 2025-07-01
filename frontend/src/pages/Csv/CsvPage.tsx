import React, { useState } from 'react';
import { Heading, Button, Spinner, Tabs, Box, Flex, Container, Text, Switch, Blockquote } from '@radix-ui/themes';
import { DotFilledIcon, MagicWandIcon, ReloadIcon, SunIcon } from '@radix-ui/react-icons';
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
import { useDarkMode } from '../../components/DarkMode';
import BorderedSection from '../../components/BorderedSection';
import FeedbackForm from '../../components/FeedbackForm';

const CsvPage = () => {
    const { darkMode, setDarkMode } = useDarkMode();
    const params = new URLSearchParams(window.location.search);
    const isBB = params.get('bb');

    const initialCategories = !!isBB ? BB_CATEGORIES : DEFAULT_DESIRED_CATEGORIES;
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [categorizedLineItems, setCategorizedLineItems] = useState<CategorizedLineItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [sumByCategory, setSumByCategory] = useState<Record<string, number>>({});
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

                setLineItems(sanitizeLineItems(items));
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
                    setLineItems(sanitizeLineItems(inProgressLineItems));
                };
                const onCompleted = (completedLineItems: LineItem[]) => {
                    if (!isEqual(lineItems, completedLineItems)) {
                        setLineItems(sanitizeLineItems(completedLineItems));
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

            setCategorizedLineItems(taggedLineItems);
            if (isEmpty(categories)) {
                // if we don't have any categories, set them from the AI classified items
                const newCategories = getCategoriesFromLineItems(taggedLineItems);
                setCategories(newCategories);
            }
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

    return (
        <Container width="100%" height="100%" p="4">
            <Heading as="h1" size="6" weight="light" mb="8">
                <Flex gap="1" align="center" justify="between">
                    <Flex gap="2" align="center">
                        <Text size="6" weight="bold">
                            <Text className="text-(--accent-11)">Sunday</Text> the budgeting day
                        </Text>
                        <SunIcon className="text-(--accent-9)" />
                    </Flex>

                    <Flex gap="4" align="center">
                        <FeedbackForm />
                        <Flex gap="2">
                            <Text size="4" weight="light">{darkMode ? 'Dark' : 'Light'} mode</Text>
                            <Switch checked={!darkMode} onCheckedChange={() => setDarkMode(!darkMode)} />
                        </Flex>
                    </Flex>
                </Flex>
            </Heading>

            <BorderedSection className="my-4 pl-4">
                <Heading as="h2" mb="4" weight="light">
                    To start, please export your credit card statement as CSV or PDF and upload it below.
                </Heading>

                <Box width="100%">
                    <Tabs.Root defaultValue="PDF">
                        <Tabs.List size="2">
                            <Box width="50%">
                                <Flex align="center" gap="8">
                                    <Tabs.Trigger value="PDF" className="text-center">PDF</Tabs.Trigger>
                                    <Tabs.Trigger value="CSV" className="text-center">CSV</Tabs.Trigger>
                                </Flex>
                            </Box>
                        </Tabs.List>

                        <Tabs.Content value="PDF">
                            <Text as="p" my="4">
                                When uploading a PDF file, AI will try to extract the text from the PDF file. Please
                                use the balance amount and total transactions to verify if the AI extracted the data correctly.
                            </Text>
                            <FileUploader
                                ref={uploadedFileInputRef}
                                acceptedFileTypes={['.pdf'] as TAcceptedFileType[]}
                                handleFileChanged={handleUploadedFileChange}
                                uploadBtnText="Upload PDF"
                                showUploadedFileName
                            />
                            <PdfStagesGraphic stage={uploading} />
                        </Tabs.Content>

                        <Tabs.Content value="CSV">
                            <BankRadioCard
                                bank={bank}
                                setBank={setBank}
                            />
                            <FileUploader
                                ref={uploadedFileInputRef}
                                acceptedFileTypes={['.csv'] as TAcceptedFileType[]}
                                handleFileChanged={handleUploadedFileChange}
                                uploadBtnText="Upload CSV"
                                showUploadedFileName
                            />
                        </Tabs.Content>
                    </Tabs.Root>
                </Box>
            </BorderedSection>

            {lineItems.length > 0 && (
                <BorderedSection className="my-4 pl-4">
                    <Flex justify="between" wrap="wrap" gap="4">
                        <Box>
                            <Heading as="h2" mb="4" weight="light">
                                Choose your method to categorize the line items.
                            </Heading>
                            <Text as="p" weight="light">• AI Categorize will use AI to classify the line items based on its description.</Text>
                            <Text as="p" weight="light">• Use previous definitions will prompt you to upload a text file you previously saved in the Definitions tab.</Text>
                            <Blockquote weight="light" my="2">You need to categorize the line items in order to enbale the <Text className="text-(--accent-10)">"Sum By Category"</Text> and <Text className="text-(--accent-10)">"Definitions"</Text> tabs</Blockquote>
                        </Box>

                        <Box mb="4">
                            <Button onClick={() => resetEverything()} color="tomato">
                                <ReloadIcon /> Start over
                            </Button>
                        </Box>
                    </Flex>
                    <Flex gap="2" width="100%" wrap="wrap" my="2">
                        <Button
                            variant="soft" radius="large" color="iris"
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
                    </Flex>
                </BorderedSection>
            )}


            <BorderedSection className="my-4 pl-4">
                <Heading as="h3" my="4">Your credit card statement</Heading>
                {lineItems.length > 0 && <TotalsCard lineItems={lineItems} />}
                {/* Summed categories */}
                <Tabs.Root defaultValue="LineItems" my="4">
                    <Tabs.List>
                        <Tabs.Trigger value="LineItems">Line Items</Tabs.Trigger>
                        <Tabs.Trigger value="SumByCategory" disabled={Object.keys(sumByCategory).length <= 0}>Sum By Category</Tabs.Trigger>
                        <Tabs.Trigger value="Definitions" disabled={Object.keys(sumByCategory).length <= 0}>Definitions</Tabs.Trigger>
                    </Tabs.List>

                    <Box overflow="scroll" my="4">
                        <Tabs.Content value="LineItems">
                            {Object.keys(sumByCategory).length > 0 && <DesiredCategories categories={categories} onCategoriesUpdate={handleCategoriesChanged} />}
                            <LineItemTable
                                lineItems={Object.keys(sumByCategory).length <= 0 ? lineItems : categorizedLineItems}
                                updateLineItem={updateLineItem}
                                categories={categories}
                                onCategoriesChange={handleCategoriesChanged}
                            />
                        </Tabs.Content>

                        <Tabs.Content value="SumByCategory">
                            <SumByCategoryTab data={sumByCategory ?? {}} />
                        </Tabs.Content>

                        <Tabs.Content value="Definitions">
                            <GlossaryTab
                                glossary={glossary}
                                categorizedLineItems={categorizedLineItems}
                            />
                        </Tabs.Content>
                    </Box>
                </Tabs.Root>
            </BorderedSection>
        </Container>
    )
}

export default CsvPage;
