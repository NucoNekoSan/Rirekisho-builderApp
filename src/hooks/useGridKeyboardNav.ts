import { useCallback } from 'react';
import type { KeyboardEvent } from 'react';

const FOCUSABLE_SELECTOR =
  'input:not([type="radio"]):not([type="checkbox"]):not([type="file"]):not([readonly]), select';

const NAV_KEYS = new Set(['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

function isCursorAtStart(input: HTMLInputElement): boolean {
  return input.selectionStart === 0 && input.selectionEnd === 0;
}

function isCursorAtEnd(input: HTMLInputElement): boolean {
  return input.selectionStart === input.value.length;
}

function getEditableRowContext(input: HTMLInputElement) {
  const row = input.closest('.edit-row');
  if (!row) return null;

  const rowFields = Array.from(row.querySelectorAll<Element>(':scope > .row-field'));
  const currentField = input.closest('.row-field');
  const columnIndex = rowFields.indexOf(currentField as Element);
  if (columnIndex < 0) return null;

  return { row, rowFields, columnIndex };
}

function findEditableRowVertical(input: HTMLInputElement, direction: -1 | 1): HTMLElement | null {
  const context = getEditableRowContext(input);
  if (!context) return null;

  const sibling = direction === 1
    ? context.row.nextElementSibling
    : context.row.previousElementSibling;
  if (!sibling || !sibling.classList.contains('edit-row')) return null;

  const siblingFields = Array.from(sibling.querySelectorAll<Element>(':scope > .row-field'));
  const targetField = siblingFields[context.columnIndex];
  if (!targetField) return null;

  return targetField.querySelector('input');
}

function findEditableRowHorizontal(input: HTMLInputElement, direction: -1 | 1): HTMLElement | null {
  const context = getEditableRowContext(input);
  if (!context) return null;

  const targetIndex = context.columnIndex + direction;
  const targetField = context.rowFields[targetIndex];
  if (!targetField) return null;

  return targetField.querySelector('input');
}

function findFormGridByOffset(input: HTMLElement, offset: -1 | 1): HTMLElement | null {
  const grid = input.closest('.form-grid');
  if (!grid) return null;

  const focusable = Array.from(grid.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  const currentIndex = focusable.indexOf(input);
  const targetIndex = currentIndex + offset;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= focusable.length) return null;

  return focusable[targetIndex];
}

function findTarget(key: string, target: HTMLInputElement): HTMLElement | null {
  switch (key) {
    case 'Enter':
    case 'ArrowDown':
      return findEditableRowVertical(target, 1) ?? findFormGridByOffset(target, 1);
    case 'ArrowUp':
      return findEditableRowVertical(target, -1) ?? findFormGridByOffset(target, -1);
    case 'ArrowLeft':
      if (!isCursorAtStart(target)) return null;
      return findEditableRowHorizontal(target, -1) ?? findFormGridByOffset(target, -1);
    case 'ArrowRight':
      if (!isCursorAtEnd(target)) return null;
      return findEditableRowHorizontal(target, 1) ?? findFormGridByOffset(target, 1);
    default:
      return null;
  }
}

export function useGridKeyboardNav() {
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (!NAV_KEYS.has(event.key)) return;
    // IME変換中のEnter・矢印キーは変換確定や候補選択に使用する。
    // SafariではEnterによる確定時にisComposingが先にfalseになる場合があるため、
    // IME処理中を示す従来のkeyCode=229も補完条件として扱う。
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type === 'radio' || target.type === 'checkbox' || target.type === 'file') return;

    const nextTarget = findTarget(event.key, target);
    if (!nextTarget) return;

    event.preventDefault();
    nextTarget.focus();
  }, []);

  return { handleKeyDown };
}
