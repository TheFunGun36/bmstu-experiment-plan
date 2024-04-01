import { DataGrid, GridColDef } from '@mui/x-data-grid';

const fmt = (value: number) => value.toFixed(4);
const columns: GridColDef[] = [
    { field: 'id' },
    { field: 'x0' },
    { field: 'x1' },
    { field: 'x2' },
    { field: 'x3' },
    { field: 'x1x2' },
    { field: 'x1x3' },
    { field: 'x2x3' },
    { field: 'x1x2x3' },
    { field: 'y', valueFormatter: fmt },
    { field: 'yl', headerName: 'yл', valueFormatter: fmt },
    { field: 'ynl', headerName: 'yнл', valueFormatter: fmt },
    { field: 'dyl', headerName: '|y-yл|', valueFormatter: fmt },
    { field: 'dynl', headerName: '|y-yнл|', valueFormatter: fmt }
]

export type Row = {
    id: number,
    x0: number,
    x1: number,
    x2: number,
    x3: number,
    x1x2: number,
    x1x3: number,
    x2x3: number,
    x1x2x3: number,
    y: number,
    yl: number,
    ynl: number,
    dyl: number,
    dynl: number,
}

interface ExperimentTableProps {
    data: Row[]
}

function ExperimentTable({ data }: ExperimentTableProps) {
    return (
        <DataGrid
            rows={data}
            columns={columns}
            showCellVerticalBorder
        />
    )
}

export default ExperimentTable;
