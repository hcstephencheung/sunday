import React, { useState } from "react"
import { UploadIcon } from "@radix-ui/react-icons"
import { Button, Flex, Text } from "@radix-ui/themes"

export type TAcceptedFileType = '.csv' | '.txt' | '.pdf';
type TExpectedFileTypes = 'text/csv' | 'text/plain' | 'application/pdf';
const expectedFileTypes = ['text/csv', 'text/plain', 'application/pdf'] as const;

const fileTypeIsExpected = (fileType: string): fileType is TExpectedFileTypes => {
    return (expectedFileTypes as unknown as string[]).includes(fileType)
}

interface FileUploaderProps {
    acceptedFileTypes: TAcceptedFileType[],
    handleFileChanged: (event: React.ChangeEvent<HTMLInputElement>) => void
    uploadBtnText: string
    showUploadedFileName: boolean
    disabled?: boolean
}
const FileUploader = React.forwardRef<HTMLInputElement, FileUploaderProps>(({
    acceptedFileTypes = ['.csv', '.txt', '.pdf'],
    handleFileChanged,
    uploadBtnText,
    showUploadedFileName,
    disabled = false,
}, ref) => {

    const [file, setFile] = useState<File | null>(null);

    const handleButtonClick = () => {
        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.click();
        }
    };

    const handleOnClick = (event: React.MouseEvent<HTMLInputElement>) => {
        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.value = '';
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFileChanged(event);

        const selectedFile = event.target.files?.[0];
        if (selectedFile && fileTypeIsExpected(selectedFile.type)) {
            setFile(selectedFile);
        }
    }

    return (
        <Flex gap="2" align="center">
            {file && showUploadedFileName &&
                <Text as="p" weight="light" className="text-(--accent-9)" truncate>
                    Uploaded file: {file.name}
                </Text>
            }
            <Button variant="soft" radius="large" onClick={handleButtonClick} disabled={disabled}>
                <UploadIcon /> {uploadBtnText}
            </Button>
            {/* hidden file input */}
            <input
                className="hidden"
                ref={ref}
                type="file"
                accept={acceptedFileTypes.join(',')}
                multiple={false}
                onClick={handleOnClick}
                onChange={handleFileChange}
                disabled={disabled}
            />
        </Flex>
    )
});

export default FileUploader;
