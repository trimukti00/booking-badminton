export default function DataTable({ columns, data, onEdit, onDelete, loading, emptyIcon = '📋', emptyText = 'Belum ada data.' }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold p-4">{col.label}</th>
              ))}
              <th className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="p-4">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </td>
                ))}
                <td className="p-4">
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-gray-100 rounded" />
                    <div className="h-8 w-20 bg-gray-100 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div className="text-3xl mb-3">{emptyIcon}</div>
        <p className="text-gray-500">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr>
            <th className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold p-4" style={{ width: 44 }}>#</th>
            {columns.map((col) => (
              <th key={col.key} className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold p-4">{col.label}</th>
            ))}
            {(onEdit || onDelete) && <th className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold p-4" style={{ width: 130 }}>Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id || idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="p-4 text-gray-500 text-sm">{idx + 1}</td>
              {columns.map((col) => (
                <td key={col.key} className="p-4 align-middle">
                  {col.render ? col.render(row) : row[col.key] ?? '-'}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="p-4">
                  <div className="flex gap-2">
                    {onEdit && (
                      <button className="bg-white border border-gray-200 text-sm px-3 py-2 rounded-lg hover:bg-gray-50" onClick={() => onEdit(row)}>
                        ✏️ Edit
                      </button>
                    )}
                    {onDelete && (
                      <button className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg hover:bg-red-100" onClick={() => onDelete(row)}>
                        🗑️ Hapus
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
