import { CheckCircledIcon } from '@radix-ui/react-icons';
import { Flex, Spinner, Text } from '@radix-ui/themes';
import React from 'react';

export enum PdfStages {
    UPLOADING = 'uploading',
    PROCESSING = 'processing',
    READY = 'ready',
    DONE = 'done'
}

const PdfStagesGraphic = ({
    stage = PdfStages.DONE
}) => {

    if (stage === PdfStages.DONE) {
        return null;
    }

    return (
        <>
            {stage === PdfStages.UPLOADING && (
                <Flex gap="2" align="center">
                    <Text weight="light" color="gray">
                        Uploading...
                    </Text>
                    <Spinner size="2" />
                </Flex>
            )}

            {stage === PdfStages.PROCESSING && (
                <Flex gap="2" align="center">
                    <Text weight="light" className="text-(--mauve-9)">
                        PDF uploaded, using AI to extract text...
                    </Text>
                    <Spinner size="2" />
                </Flex>
            )}

            {stage === PdfStages.READY && (
                <Flex gap="2" align="center">
                    <Text weight="light" className="text-(--green-9)">
                        PDF procssed, line items are generated.
                    </Text>
                    <CheckCircledIcon color="green" />
                </Flex>
            )}
        </>
    )
}

export default PdfStagesGraphic;