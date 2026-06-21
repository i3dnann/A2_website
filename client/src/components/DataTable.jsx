import { Search } from "lucide-react";
import { StatusBadge } from "./StatusBadge.jsx";

export function DataTable({ rows = [], columns = [], search, onSearch, empty = "No records found." }) {
  return (
    <div className="overflow-hidden rounded-lg border border-a2-border bg-black/30">
      {onSearch && (
        <div className="flex items-center gap-2 border-b border-a2-border p-3">
          <Search size={16} className="text-a2-green" />
          <input className="form-input py-2" value={search || ""} onChange={(event) => onSearch(event.target.value)} placeholder="Search records..." />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-a2-border text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wide text-white/45">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-bold">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-a2-border/80">
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-white/50" colSpan={columns.length}>{empty}</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id || JSON.stringify(row)} className="hover:bg-white/[0.03]">
                {columns.map((column) => {
                  const value = column.render ? column.render(row) : row[column.key];
                  return (
                    <td key={column.key} className="px-4 py-3 text-white/72">
                      {column.status ? <StatusBadge status={value} live={row.is_live} /> : value || <span className="text-white/30">None</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
