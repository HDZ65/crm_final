/**
 * CSV Export Utilities
 * Client-side CSV generation and download
 */

/**
 * Escape CSV field values
 * Wraps fields containing commas, quotes, or newlines in quotes
 * and escapes internal quotes by doubling them
 */
function escapeCSVField(field: unknown): string {
  if (field === null || field === undefined) {
    return ""
  }

  const str = String(field)

  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Convert array of objects to CSV string
 * @param data - Array of objects to convert
 * @param headers - Optional custom headers (defaults to object keys)
 * @returns CSV string with headers and data rows
 */
export function convertToCSV(
  data: Record<string, unknown>[],
  headers?: string[]
): string {
  if (!data || data.length === 0) {
    return ""
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0])

  // Create header row
  const headerRow = csvHeaders.map(escapeCSVField).join(",")

  // Create data rows
  const dataRows = data.map((row) =>
    csvHeaders.map((header) => escapeCSVField(row[header])).join(",")
  )

  // Combine headers and data
  return [headerRow, ...dataRows].join("\n")
}

/**
 * Trigger browser download of CSV file
 * @param csv - CSV string content
 * @param filename - Name of the file to download
 */
export function downloadCSV(csv: string, filename: string): void {
  // Create blob from CSV string
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })

  // Create object URL
  const url = URL.createObjectURL(blob)

  // Create temporary link element
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.style.display = "none"

  // Append to body, click, and remove
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up object URL
  URL.revokeObjectURL(url)
}

/**
 * Export data to CSV file
 * Combines conversion and download in one function
 * @param data - Array of objects to export
 * @param filename - Name of the file to download
 * @param headers - Optional custom headers
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  headers?: string[]
): void {
  const csv = convertToCSV(data, headers)
  if (csv) {
    downloadCSV(csv, filename)
  }
}
