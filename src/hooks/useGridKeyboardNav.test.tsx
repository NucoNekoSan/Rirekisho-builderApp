import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useGridKeyboardNav } from './useGridKeyboardNav';

function FormGrid() {
  const { handleKeyDown } = useGridKeyboardNav();
  return (
    <div className="form-grid" onKeyDown={handleKeyDown}>
      <input aria-label="first" defaultValue="abc" />
      <input aria-label="second" />
      <textarea aria-label="notes" />
    </div>
  );
}

function EditableGrid() {
  const { handleKeyDown } = useGridKeyboardNav();
  return (
    <div className="editable-rows" onKeyDown={handleKeyDown}>
      <div className="edit-row">
        <div className="row-field"><input aria-label="row 1 year" /></div>
        <div className="row-field"><input aria-label="row 1 month" /></div>
      </div>
      <div className="edit-row">
        <div className="row-field"><input aria-label="row 2 year" /></div>
        <div className="row-field"><input aria-label="row 2 month" /></div>
      </div>
    </div>
  );
}

describe('useGridKeyboardNav', () => {
  it('moves through a form grid with Enter and boundary arrow keys', () => {
    render(<FormGrid />);
    const first = screen.getByRole('textbox', { name: 'first' }) as HTMLInputElement;
    const second = screen.getByRole('textbox', { name: 'second' });

    first.focus();
    first.setSelectionRange(1, 1);
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(first).toHaveFocus();

    first.setSelectionRange(first.value.length, first.value.length);
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(second).toHaveFocus();

    first.focus();
    fireEvent.keyDown(first, { key: 'Enter' });
    expect(second).toHaveFocus();
  });

  it('moves vertically within editable rows and horizontally within a row', () => {
    render(<EditableGrid />);
    const firstYear = screen.getByRole('textbox', { name: 'row 1 year' }) as HTMLInputElement;
    const firstMonth = screen.getByRole('textbox', { name: 'row 1 month' });
    const secondYear = screen.getByRole('textbox', { name: 'row 2 year' });

    firstYear.focus();
    fireEvent.keyDown(firstYear, { key: 'ArrowDown' });
    expect(secondYear).toHaveFocus();

    firstYear.focus();
    fireEvent.keyDown(firstYear, { key: 'Enter' });
    expect(secondYear).toHaveFocus();

    firstYear.focus();
    firstYear.setSelectionRange(0, 0);
    fireEvent.keyDown(firstYear, { key: 'ArrowRight' });
    expect(firstMonth).toHaveFocus();
  });

  it('leaves textarea and modified key behavior unchanged', () => {
    render(<FormGrid />);
    const first = screen.getByRole('textbox', { name: 'first' });
    const second = screen.getByRole('textbox', { name: 'second' });
    const notes = screen.getByRole('textbox', { name: 'notes' });

    notes.focus();
    fireEvent.keyDown(notes, { key: 'Enter' });
    expect(notes).toHaveFocus();

    first.focus();
    fireEvent.keyDown(first, { key: 'Enter', shiftKey: true });
    expect(first).toHaveFocus();
    expect(second).not.toHaveFocus();
  });

  it('keeps focus and browser behavior while an IME composition is active', () => {
    render(<FormGrid />);
    const first = screen.getByRole('textbox', { name: 'first' }) as HTMLInputElement;
    const second = screen.getByRole('textbox', { name: 'second' });

    first.focus();
    fireEvent.change(first, { target: { value: '佐藤' } });

    const enterHandledByBrowser = fireEvent.keyDown(first, {
      key: 'Enter',
      isComposing: true,
    });
    expect(enterHandledByBrowser).toBe(true);
    expect(first).toHaveFocus();
    expect(first).toHaveValue('佐藤');
    expect(second).toHaveValue('');

    const arrowHandledByBrowser = fireEvent.keyDown(first, {
      key: 'ArrowDown',
      isComposing: true,
    });
    expect(arrowHandledByBrowser).toBe(true);
    expect(first).toHaveFocus();
  });

  it('keeps focus for the Safari IME keyCode 229 fallback', () => {
    render(<FormGrid />);
    const first = screen.getByRole('textbox', { name: 'first' });
    const second = screen.getByRole('textbox', { name: 'second' });

    first.focus();
    const handledByBrowser = fireEvent.keyDown(first, {
      key: 'Enter',
      keyCode: 229,
    });

    expect(handledByBrowser).toBe(true);
    expect(first).toHaveFocus();
    expect(second).not.toHaveFocus();
  });

  it('keeps focus in an editable row while an IME composition is active', () => {
    render(<EditableGrid />);
    const firstYear = screen.getByRole('textbox', { name: 'row 1 year' });
    const secondYear = screen.getByRole('textbox', { name: 'row 2 year' });

    firstYear.focus();
    const handledByBrowser = fireEvent.keyDown(firstYear, {
      key: 'Enter',
      isComposing: true,
    });

    expect(handledByBrowser).toBe(true);
    expect(firstYear).toHaveFocus();
    expect(secondYear).not.toHaveFocus();
  });
});
