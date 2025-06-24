import { Card, Checkbox, Flex, Text } from "@radix-ui/themes";
import React from "react";
import { LineItem } from "../pages/Csv/types";

interface TotalsCardProps {
    lineItems: LineItem[];
}
const TotalsCard = ({
    lineItems = []
}: TotalsCardProps) => {
    const [excludePayments, setExcludePayments] = React.useState(true);

    let modifiedLineItems = lineItems;
    if (excludePayments) {
        modifiedLineItems = lineItems.filter(item => {
            const paymentRegex = /^(?=.*PAYMENT)(?=.*THANK)(?=.*YOU).*/is;
            const paymentTransferred = /^(?=.*PAYMENT)(?=.*FROM).*/is;
            return !paymentRegex.test(item.description) && !paymentTransferred.test(item.description);
        });
    }

    const totalSum = modifiedLineItems.reduce((sum, item) => {
        return sum + item.amount;
    }, 0);
    const totalTransactions = modifiedLineItems.length;

    const handleCheckChanged = (checked: boolean) => {
        setExcludePayments(checked);
    };

    return (
        <Card my="4">
            <Flex gap="2" align="center" justify="between">
                <Text size="6" weight="bold">
                    Balance {excludePayments && <Text weight="light">(excluding payments)</Text>}:
                </Text>
                <Text size="6" weight="light" color="green">
                    ${totalSum.toFixed(2)}
                </Text>
            </Flex>

            <Flex gap="2" my="2" align="center" justify="between">
                <Text size="6" weight="bold">
                    Transactions {excludePayments && <Text weight="light">(excluding payments)</Text>}:
                </Text>
                <Text size="6" weight="light" color="green">
                    {totalTransactions}
                </Text>
            </Flex>

            <Flex gap="2" align="center">
                <Text size="4">Exclude payments </Text>
                <Checkbox checked={excludePayments} onCheckedChange={handleCheckChanged} size="4" />
            </Flex>
        </Card>
    )
}

export default TotalsCard;
