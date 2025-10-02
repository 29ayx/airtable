// Debounce utility
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Cell key utilities
export const createCellKey = (rowId: string, columnId: string) => `${rowId}-${columnId}`
export const parseCellKey = (cellKey: string) => cellKey.split('-')

// Temp ID generators
export const createTempRowId = () => `temp-row-${Date.now()}`
export const createTempColumnId = (name: string) => `temp-col-${name}`
