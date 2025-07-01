import { Blockquote, Card, Flex, Heading, RadioCards, Text } from "@radix-ui/themes";
import { RadioGroup } from "radix-ui";
import React, { Dispatch, SetStateAction } from "react";
import { transformScotiabankCsvToLineItem, transformTdCsvToLineItem, transformCibcCsvToLineItem } from "../pages/Csv/utils";
import classNames from "classnames";

export enum Banks {
    SCOTIABANK = 'Scotiabank',
    TD = 'TD',
    CIBC = 'CIBC'
}
const BankColors = {
    [Banks.SCOTIABANK]: 'red',
    [Banks.TD]: 'green',
    [Banks.CIBC]: 'crimson'
} as const;
export const CsvTransformerByBank = {
    [Banks.SCOTIABANK]: transformScotiabankCsvToLineItem,
    [Banks.TD]: transformTdCsvToLineItem,
    [Banks.CIBC]: transformCibcCsvToLineItem
}

interface BankRadioCardProps {
    bank: Banks,
    setBank: Dispatch<SetStateAction<Banks>>
}
export const BankRadioCard = ({
    bank,
    setBank
}: BankRadioCardProps) => {
    const handleBankChange = React.useCallback((value: Banks) => {
        setBank(value);
    }, [setBank]);

    return (
        <>
            <Text as="p" my="4">
                When uploading a CSV file, you must select the bank that the CSV is from.
                This is important because each bank has a different format for their CSV files.
            </Text>

            <Blockquote my="2">
                Unlike PDFs, CSV files are directly converted to line items without using AI, making them more reliable
                and free from hallucination or misinterpretation risks.
            </Blockquote>

            <RadioGroup.Root
                defaultValue={bank}
                onValueChange={handleBankChange}
                className="my-4"
            >
                <Flex gap="6" align="center" width="100%" wrap="wrap">
                    {Object.entries(Banks).map(([_, bankName], index) => (
                        <RadioGroup.Item key={index} value={bankName} asChild id={bankName}>
                            <div className={classNames(
                                'py-2 px-4 my-2 rounded-lg bg-(--white) border border-solid shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md',
                                {
                                    'border-(--accent-9)': bank === bankName,
                                    'border-transparent hover:border-(--accent-5)': bank !== bankName
                                }
                            )}>
                                <Text color={BankColors[bankName]} htmlFor={bankName}>{bankName}</Text>
                            </div>
                        </RadioGroup.Item>
                    ))}
                </Flex>
            </RadioGroup.Root>
        </>
    )
}
