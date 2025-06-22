import React, { useState } from "react";
import { Box, Select, TextField, Text, Flex } from "@radix-ui/themes";
import { Select as SelectPrimitive } from "radix-ui";
import { CaretDownIcon } from "@radix-ui/react-icons";
import classNames from "classnames";

export interface TypeableSelectOption {
    label: string;
    value: string;
    color?: string;
};

export interface TypeableSelectProps {
    options: TypeableSelectOption[];
    defaultOption: TypeableSelectOption,
    onOptionsChange: (options: TypeableSelectOption[]) => void,
    onSelectedOptionChange: (value: string) => void,
    triggerClassNames?: string | string[],
    annotationOptionFn?: (option: TypeableSelectOption) => Select.ItemProps | {},
    selectionColor?: string;
}

const TypeableSelect = ({
    options,
    defaultOption,
    onOptionsChange,
    onSelectedOptionChange,
    triggerClassNames = '',
    annotationOptionFn,
    selectionColor = 'accent'
}: TypeableSelectProps) => {
    const [textInput, setTextInput] = useState('');
    const [open, setOpenChange] = useState(false);

    const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTextInput(e.target.value);
    };

    const addOption = () => {
        const sanitizedTextInput = textInput.trim().toLowerCase();
        const newOption = {
            label: textInput.trim(),
            value: sanitizedTextInput
        }
        if (sanitizedTextInput !== '') {
            onOptionsChange([...options, newOption]);
            onSelectedOptionChange(newOption.value);
            setTextInput('');
        }
    }

    const handleTextInputKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && textInput.trim()) {
            addOption();
            setTextInput('');
        }
    }

    const handleSelectTriggerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setOpenChange(!open);
    };

    return (
        <Select.Root onValueChange={onSelectedOptionChange} value={defaultOption.value} open={open} onOpenChange={setOpenChange}>
            <Box minWidth="240px" style={{ fontSize: '16px' }}>
                <TextField.Root placeholder="Add a category..." value={textInput} onChange={handleTextInputChange} onKeyDown={handleTextInputKeydown}>
                    <TextField.Slot pl="0">
                        <SelectPrimitive.Trigger asChild onTouchStart={handleSelectTriggerClick}>
                            <Flex maxWidth="125px" height="100%" px="2" align="center"
                                className={classNames("items-center px-2 text-sm cursor-pointer rounded-l-(--text-field-border-radius)", triggerClassNames)}
                            >
                                <Text truncate>
                                    {defaultOption.value}
                                </Text>
                                <CaretDownIcon />
                            </Flex>
                        </SelectPrimitive.Trigger>
                    </TextField.Slot>
                </TextField.Root>
            </Box >

            <Select.Content position="popper" side="bottom" color={selectionColor}>
                {options.map((option, idx) => {
                    let annotatedProps = {};
                    if (annotationOptionFn && typeof annotationOptionFn === 'function') {
                        annotatedProps = annotationOptionFn(option);
                    }

                    return (
                        <Select.Item
                            value={option.value}
                            key={`${option.value}-${idx}`}
                            {...annotatedProps}
                        >{option.label}</Select.Item>
                    )
                })}
            </Select.Content>
        </Select.Root >
    )
}

export default TypeableSelect;