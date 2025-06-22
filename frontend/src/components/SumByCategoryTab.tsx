import { FilePlusIcon } from "@radix-ui/react-icons"
import { TextProps, Button } from "@radix-ui/themes"
import { UNCATEGORIZED } from "../pages/Csv/types"
import { exportSumsToCsv } from "../pages/Csv/utils"
import DataTable from "./DataTable"
import React from "react"

interface SumByCategoryTabProps {
    data: Record<string, number>
}
const SumByCategoryTab = ({
    data
}: SumByCategoryTabProps) => {

    const markUncategorizedAsRed = { [UNCATEGORIZED]: { color: 'tomato' } as TextProps }

    return (
        <>
            <Button
                onClick={() => exportSumsToCsv(data)}
                my="4"
            >
                <FilePlusIcon /> Export to CSV
            </Button>
            <DataTable data={data} keyTextProps={markUncategorizedAsRed} />
        </>
    )
}

export default SumByCategoryTab;