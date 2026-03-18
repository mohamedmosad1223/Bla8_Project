import './DataTable.css';

interface Column {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  showMoreLink?: string;
}

const DataTable = ({ title, columns, data, showMoreLink }: DataTableProps) => {
  return (
    <div className="data-table-container">
      <div className="table-header">
        <h3 className="table-title">{title}</h3>
        {showMoreLink && (
          <select className="table-filter-select">
            <option>الكل</option>
          </select>
        )}
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((col, colIdx) => (
                  <td key={colIdx}>
                    {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
