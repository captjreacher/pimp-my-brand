import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { PalettePicker } from '../PalettePicker';
import { ColorSwatch } from '@/lib/ai/types';

// Mock the lucide-react icons
vi.mock('lucide-react', () => ({
  Palette: () => <div data-testid="palette-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  X: () => <div data-testid="x-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />
}));

describe('PalettePicker', () => {
  const mockPalette: ColorSwatch[] = [
    { name: 'Primary', hex: '#3b82f6' },
    { name: 'Secondary', hex: '#64748b' }
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders the palette picker with title', () => {
    render(<PalettePicker palette={mockPalette} onChange={mockOnChange} />);
    
    expect(screen.getByText('Color Palette')).toBeInTheDocument();
    expect(screen.getByTestId('palette-icon')).toBeInTheDocument();
  });

  it('displays current colors correctly', () => {
    render(<PalettePicker palette={mockPalette} onChange={mockOnChange} />);
    
    expect(screen.getByDisplayValue('Primary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Secondary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#3b82f6')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#64748b')).toBeInTheDocument();
  });

  it('shows color swatches with correct background colors', () => {
    render(<PalettePicker palette={mockPalette} onChange={mockOnChange} />);
    
    const colorSwatches = screen.getAllByRole('generic').filter(el => 
      el.style.backgroundColor && el.className.includes('w-12 h-12')
    );
    
    expect(colorSwatches).toHaveLength(2);
    expect(colorSwatches[0]).toHaveStyle({ backgroundColor: 'rgb(59, 130, 246)' });
    expect(colorSwatches[1]).toHaveStyle({ backgroundColor: 'rgb(100, 116, 139)' });
  });

  it('allows editing color names', async () => {
    const user = userEvent.setup();
    render(<PalettePicker palette={mockPalette} onChange={mockOnChange} />);
    
    const nameInput = screen.getByDisplayValue('Primary');
    await user.clear(nameInput);
    await user.type(nameInput, 'Brand Blue');
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { name: 'Brand Blue', hex: '#3b82f6' },
      { name: 'Secondary', hex: '#64748b' }
    ]);
  });

  it('allows editing color hex values', async () => {
    const user = userEvent.setup();
    render(<PalettePicker palette={mockPalette} onChange={mockOnChange} />);
    
    const hexInput = screen.getByDisplayValue('#3b82f6');
    await user.clear(hexInput);
    await user.type(hexInput, '#ff0000');
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { name: 'Primary', hex: '#ff0000' },
      { name: 'Secondary', hex: '#64748b' }
    ]);
  });

  it('allows removing colors', async () => {
    const user = userEvent.setup();
    render(<PalettePicker palette={mockPalette} onChange={mockOnChange} />);
    
    const removeButtons = screen.getAllByTestId('x-icon');
    await user.click(removeButtons[0]);
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { name: 'Secondary', hex: '#64748b' }
    ]);
  });

  it('shows add new color section when under max colors', () => {
    render(<PalettePicker palette={mockPalette} onChange={mockOnChange} maxColors={5} />);
    
    expect(screen.getByText('Add New Color')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Color name (e.g., Primary, Accent)')).toBeInTheDocument();
  });

  it('hides add new color section when at max colors', () => {
    render(<PalettePicker palette={mockPalette} onChange={mockOnChange} maxColors={2} />);
    
    expect(screen.queryByText('Add New Color')).not.toBeInTheDocument();
  });

  it('allows adding new colors', async () => {
    const user = userEvent.setup();
    render(<PalettePicker palette={mockPalette} onChange={mockOnChange} />);
    
    const nameInput = screen.getByPlaceholderText('Color name (e.g., Primary, Accent)');
    const colorInput = screen.getByDisplayValue('#000000');
    const addButton = screen.getByRole('button', { name: /add/i });
    
    await user.type(nameInput, 'Accent');
    await user.clear(colorInput);
    await user.type(colorInput, '#10b981');
    await user.click(addButton);
    
    expect(mockOnChange).toHaveBeenCalledWith([
      ...mockPalette,
      { name: 'Accent', hex: '#10b981' }
    ]);
  });

  it('disables add button when name is empty', () => {
    render(<PalettePicker palette={mockPalette} onChange={mockOnChange} />);
    
    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeDisabled();
  });

  it('disables add button when at max colors', () => {
    render(<PalettePicker palette={mockPalette} onChange={mockOnChange} maxColors={2} />);
    
    // Should not render add section at all when at max
    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
  });

  it('shows color wheel when palette button is clicked', async () => {
    const user = userEvent.setup();
    render(<PalettePicker palette={mockPalette} onChange={mockOnChange} />);
    
    const paletteButton = screen.getAllByTestId('palette-icon')[1]; // Second one is in the add section
    await user.click(paletteButton.closest('button')!);
    
    expect(screen.getByText('Quick Color Selection')).toBeInTheDocument();
  });

  it('selects color from color wheel', async () => {
    const user = userEvent.setup();
    render(<PalettePicker palette={mockPalette} onChange={mockOnChange} />);
    
    // Open color wheel
    const paletteButton = screen.getAllByTestId('palette-icon')[1];
    await user.click(paletteButton.closest('button')!);
    
    // Click on a color wheel button
    const colorWheelButtons = screen.getAllByRole('button').filter(btn => 
      btn.title && btn.title.includes('Hue')
    );
    
    expect(colorWheelButtons.length).toBeGreaterThan(0);
    await user.click(colorWheelButtons[0]);
    
    // Color wheel should close
    expect(screen.queryByText('Quick Color Selection')).not.toBeInTheDocument();
  });

  it('shows palette preview with color names and hex values', () => {
    render(<PalettePicker palette={mockPalette} onChange={mockOnChange} />);
    
    expect(screen.getByText('Palette Preview')).toBeInTheDocument();
    
    // Check for color names in preview
    const previewSection = screen.getByText('Palette Preview').closest('div');
    expect(previewSection).toHaveTextContent('Primary');
    expect(previewSection).toHaveTextContent('Secondary');
    expect(previewSection).toHaveTextContent('#3B82F6');
    expect(previewSection).toHaveTextContent('#64748B');
  });

  it('shows accessibility warnings for low contrast colors', () => {
    const lowContrastPalette: ColorSwatch[] = [
      { name: 'Light Gray', hex: '#f0f0f0' },
      { name: 'White', hex: '#ffffff' }
    ];
    
    render(<PalettePicker palette={lowContrastPalette} onChange={mockOnChange} />);
    
    expect(screen.getByText('Accessibility Warnings')).toBeInTheDocument();
    expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    expect(screen.getByText(/WCAG AA requires a contrast ratio/)).toBeInTheDocument();
  });

  it('does not show accessibility warnings for good contrast colors', () => {
    const goodContrastPalette: ColorSwatch[] = [
      { name: 'Black', hex: '#000000' },
      { name: 'White', hex: '#ffffff' }
    ];
    
    render(<PalettePicker palette={goodContrastPalette} onChange={mockOnChange} />);
    
    expect(screen.queryByText('Accessibility Warnings')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PalettePicker palette={mockPalette} onChange={mockOnChange} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('clears new color inputs after adding a color', async () => {
    const user = userEvent.setup();
    render(<PalettePicker palette={[]} onChange={mockOnChange} />);
    
    const nameInput = screen.getByPlaceholderText('Color name (e.g., Primary, Accent)');
    const addButton = screen.getByRole('button', { name: /add/i });
    
    await user.type(nameInput, 'Test Color');
    await user.click(addButton);
    
    expect(nameInput).toHaveValue('');
    expect(screen.getByDisplayValue('#000000')).toBeInTheDocument(); // Color input reset
  });

  it('handles empty palette correctly', () => {
    render(<PalettePicker palette={[]} onChange={mockOnChange} />);
    
    expect(screen.getByText('Current Colors')).toBeInTheDocument();
    expect(screen.getByText('Add New Color')).toBeInTheDocument();
    expect(screen.getByText('Palette Preview')).toBeInTheDocument();
    
    // Should not show any color swatches
    const colorSwatches = screen.queryAllByRole('generic').filter(el => 
      el.style.backgroundColor && el.className.includes('w-12 h-12')
    );
    expect(colorSwatches).toHaveLength(0);
  });
});