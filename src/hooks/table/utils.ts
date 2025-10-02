// Debounce utility
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

// Cell key utilities
export const createCellKey = (rowId: string, columnId: string) => `${rowId}-${columnId}`
export const parseCellKey = (cellKey: string) => cellKey.split('-')

// Temp ID generators
export const createTempRowId = () => `temp-row-${Date.now()}`
export const createTempColumnId = (name: string) => `temp-col-${name}`
