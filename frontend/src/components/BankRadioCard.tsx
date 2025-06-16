import { Blockquote, Heading, RadioCards, Text } from "@radix-ui/themes";
import React, { Dispatch, SetStateAction } from "react";
import { transformScotiabankCsvToLineItem, transformTdCsvToLineItem, transformCibcCsvToLineItem } from "../pages/Csv/utils";

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
            <Heading as="h2" mb="4" weight="light">
                To start, export your credit card statement as CSV from your bank.
            </Heading>
            <Blockquote my="4">
                Each bank formats their CSVs slightly differently, so it's important to choose
                the correct bank before uploading your CSV.
            </Blockquote>
            <RadioCards.Root
                defaultValue={bank}
                onValueChange={handleBankChange}
                variant="classic"
                columns="repeat(auto-fit, minmax(100px, 1fr))"
            >
                {Object.entries(Banks).map(([_, bankName], index) => (
                    <RadioCards.Item key={index} value={bankName} className="w-full">
                        <Text color={BankColors[bankName]}>{bankName}</Text>
                    </RadioCards.Item>
                ))}
            </RadioCards.Root>
        </>
    )
}
