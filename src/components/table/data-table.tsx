"use client"

import React from 'react'
import { Plus } from "lucide-react"
import { useHotkeys } from 'react-hotkeys-hook'
import { ColumnHeader } from "./column-header"
import { EditableCell } from "./editable-cell"

interface DataTableProps {
  table: any
  addRow: () => void
  addColumn: () => void
  searchTerm?: string
}

export const DataTable: React.FC<DataTableProps> = ({ 
  table, 
  addRow, 
  addColumn,
  searchTerm = ''
}) => {
  // Get table meta functions
  const deleteSelectedCells = table.options.meta?.deleteSelectedCells;
  const selectedCells = table.options.meta?.selectedCells;
  const focusedCell = table.options.meta?.focusedCell;
  const updateData = table.options.meta?.updateData;
  const navigateCell = table.options.meta?.navigateCell;
  const setFocusedCell = table.options.meta?.setFocusedCell;
  const setEditingCell = table.options.meta?.setEditingCell;
  const clearSelection = table.options.meta?.clearSelection;
  const setSelectedColumn = table.options.meta?.setSelectedColumn;
  const undo = table.options.meta?.undo;
  const redo = table.options.meta?.redo;

  // Handle delete key with react-hotkeys-hook
  useHotkeys('delete, backspace', (e) => {
    e.preventDefault();
    
    // If there are selected cells, delete them
    if (selectedCells && selectedCells.size > 0 && deleteSelectedCells) {
      deleteSelectedCells();
    }
    // If no selected cells but there's a focused cell, clear that cell
    else if (focusedCell && updateData) {
      updateData(focusedCell.rowId, focusedCell.columnId, '');
    }
    else {
      // If nothing is focused, try to focus the first cell
      if (!focusedCell && setFocusedCell) {
        const rows = table.getRowModel().rows;
        const columns = table.getVisibleLeafColumns();
        if (rows.length > 0 && columns.length > 0) {
          const firstRow = rows[0];
          const firstColumn = columns[0];
          if (firstRow && firstColumn) {
            const firstCellId = { 
              rowId: firstRow.original?.id ?? firstRow.id, 
              columnId: firstColumn.id 
            };
            setFocusedCell(firstCellId);
          }
        }
      }
    }
  }, {
    enableOnFormTags: false, // Don't trigger when typing in inputs
    preventDefault: true
  });

  // Handle arrow keys
  useHotkeys('up, down, left, right', (e, handler) => {
    // Don't navigate if we're currently editing a cell
    if (table.options.meta?.editingCell) {
      return;
    }
    
    e.preventDefault();
    
    // If no cell is focused, focus the first cell
    if (!focusedCell && setFocusedCell) {
      const rows = table.getRowModel().rows;
      const columns = table.getVisibleLeafColumns();
      if (rows.length > 0 && columns.length > 0) {
        const firstRow = rows[0];
        const firstColumn = columns[0];
        if (firstRow && firstColumn) {
          const firstCellId = { 
            rowId: firstRow.original?.id ?? firstRow.id, 
            columnId: firstColumn.id 
          };
          setFocusedCell(firstCellId);
        }
      }
      return;
    }
    
    if (navigateCell) {
      const keyPressed = handler.keys?.[0];
      navigateCell(keyPressed as any);
    }
  }, {
    enableOnFormTags: false,
    preventDefault: true
  });

  // Handle Enter key
  useHotkeys('enter', (e) => {
    if (focusedCell && setEditingCell) {
      e.preventDefault();
      setEditingCell(focusedCell);
      clearSelection?.();
      setSelectedColumn?.(null);
    }
  }, {
    enableOnFormTags: false,
    preventDefault: true
  });

  // Handle undo/redo
  useHotkeys('ctrl+z, cmd+z', (e) => {
    e.preventDefault();
    undo?.();
  }, {
    enableOnFormTags: false,
    preventDefault: true
  });

  useHotkeys('ctrl+shift+z, cmd+shift+z, ctrl+y, cmd+y', (e) => {
    e.preventDefault();
    redo?.();
  }, {
    enableOnFormTags: false,
    preventDefault: true
  });

  // Handle escape
  useHotkeys('escape', (e) => {
    e.preventDefault();
    clearSelection?.();
    setEditingCell?.(null); // Exit edit mode on escape
  }, {
    enableOnFormTags: false,
    preventDefault: true
  });

  // Handle typing to start edit mode - use a global keydown listener for better character capture
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if we have a focused cell and we're not already editing
      if (!focusedCell || table.options.meta?.editingCell) return;
      
      // Don't handle if target is an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }
      
      // Don't handle modifier keys, function keys, or special keys
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) {
        return;
      }
      
      // Handle printable characters (letters, numbers, symbols, space)
      if (e.key.match(/^[a-zA-Z0-9\s\W]$/)) {
        e.preventDefault();
        // Start editing with the typed character
        setEditingCell?.(focusedCell);
        
        // Set a timeout to allow the input to render, then set its value
        setTimeout(() => {
          const inputs = document.querySelectorAll('input[autofocus]');
          const activeInput = inputs[inputs.length - 1] as HTMLInputElement; // Get the most recent autofocus input
          if (activeInput) {
            activeInput.value = e.key;
            activeInput.setSelectionRange(1, 1); // Put cursor at end
          }
        }, 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedCell, setEditingCell, table.options.meta?.editingCell]);

  // Handle mouse events
  React.useEffect(() => {
    const handleMouseUp = () => {
      const endSelection = table.options.meta?.endSelection;
      if (endSelection) {
        endSelection();
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [table]);

  // Auto-focus the table container when it mounts so arrow keys work immediately
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    // Focus the table container after a short delay to ensure it's rendered
    const timer = setTimeout(() => {
      if (tableContainerRef.current) {
        tableContainerRef.current.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      ref={tableContainerRef}
      className="flex-1 overflow-auto bg-[#f6f8fc] outline-none" 
      tabIndex={0}
    >
      <table className="border-collapse bg-white">
        <thead>
          {table.getHeaderGroups().map((headerGroup: any) => (
            <tr key={headerGroup.id}>
              {/* Row Selection Header */}
              <th className="border border-gray-200 px-1 py-1 w-12 ">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={table.getIsAllRowsSelected()}
                  onChange={table.getToggleAllRowsSelectedHandler()}
                />
              </th>
              {headerGroup.headers.map((header: any) => (
                <th
                  key={header.id}
                  className="border border-gray-200 relative p-0"
                  style={{ width: header.getSize() }}
                >
                   {header.isPlaceholder ? null : (
                     <ColumnHeader
                       column={header.column}
                       table={table}
                     />
                   )}
                  {/* Column Resize Handle */}
                  <div
                    className="absolute right-0 top-0 h-full w-1 bg-transparent hover:bg-blue-500 cursor-col-resize"
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                  />
                </th>
              ))}
              {/* Add Column Template */}
              <th className="border border-gray-200 px-2 py-1 w-10">
                <button
                  className="flex items-center justify-center h-5 w-6"
                  onClick={addColumn}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </th>
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row: any, index: number) => (
            <tr 
              key={row.id} 
              className={`group ${row.getIsSelected() ? 'bg-blue-50' : ''}`}
            >
              {/* Row Selection Cell */}
              <td className={`border border-gray-200 px-1 py-1 h-8 w-12 text-center text-xs cursor-pointer group ${row.getIsSelected() ? 'bg-blue-100' : ''}`}>
                <div 
                  className="flex items-center justify-center h-full"
                  onClick={row.getToggleSelectedHandler()}
                >
                  {row.getIsSelected() ? (
                    <input
                      type="checkbox"
                      className="w-3 h-3"
                      checked={true}
                      onChange={() => undefined}
                      tabIndex={-1}
                    />
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        className="w-3 h-3 opacity-0 group-hover:opacity-100"
                        checked={false}
                        onChange={() => undefined}
                        tabIndex={-1}
                      />
                      <span className="text-gray-500 group-hover:opacity-0 absolute">{index + 1}</span>
                    </>
                  )}
                </div>
              </td>
              {row.getVisibleCells().map((cell: any) => (
                <td
                  key={cell.id}
                  className="border border-gray-200 h-8 text-xs p-0"
                >
                  <EditableCell
                    value={cell.getValue()}
                    row={row}
                    column={cell.column}
                    table={table}
                    searchTerm={searchTerm}
                  />
                </td>
              ))}
            </tr>
          ))}
          {/* Add Row Template - Single Row Spanning All Columns */}
          <tr className="group">
            <td 
              colSpan={(table.getHeaderGroups()[0]?.headers.length ?? 0) + 2} 
              className="border border-gray-200 px-1 py-1 h-8"
            >
              <button
                className="flex items-center justify-center gap-1 w-full h-8 text-xs"
                onClick={addRow}
              >
                <Plus className="h-3 w-3" />
                <span>Add row</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
