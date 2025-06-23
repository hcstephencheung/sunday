import { Card, Flex, Text } from "@radix-ui/themes";
import React from "react";

const TotalsCard = ({
    totalSum = 0,
    totalTransactions = 0
}) => {
    return (
        <Card my="4">
            <Flex gap="2" align="center" justify="between">
                <Text size="6" weight="bold">
                    Total <Text weight="light">(excluding payments)</Text>:
                </Text>
                <Text size="6" weight="light" color="green">
                    ${totalSum.toFixed(2)}
                </Text>
            </Flex>

            <Flex gap="2" align="center" justify="between">
                <Text size="6" weight="bold">
                    Transactions <Text weight="light">(excluding payments)</Text>:
                </Text>
                <Text size="6" weight="light" color="green">
                    {totalTransactions}
                </Text>
            </Flex>
        </Card>
    )
}

export default TotalsCard;
