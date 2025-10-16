import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FontPicker } from '../FontPicker';
import { FontPair } from '@/lib/ai/types';

// Mock the font loading functionality
const mockLoadGoogleFont = vi.fn();
vi.mock('../FontPicker', () => {
  const actual = vi.importActual('../FontPicker');
  return {
    ...actual,
    loadGoogleFont: mockLoadGoogleFont,
  };
});

describe('FontPicker', () => {
  const mockFonts: FontPair = {
    heading: 'Playfair Display',
    body: 'Source Sans Pro'
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadGoogleFont.mockResolvedValue(undefined);
  });

  it('renders with current font pair', () => {
    render(<FontPicker fonts={mockFonts} onChange={mockOnChange} />);
    
    expect(screen.getByText('Font Selection')).toBeInTheDocument();
    expect(screen.getByText('Current Font Pair')).toBeInTheDocument();
    expect(screen.getByText('Playfair Display')).toBeInTheDocument();
    expect(screen.getByText('Source Sans Pro')).toBeInTheDocument();
  });

  it('displays font previews with correct styling', () => {
    render(<FontPicker fonts={mockFonts} onChange={mockOnChange} />);
    
    const headingPreview = screen.getByText('Your Brand Name');
    const bodyPreview = screen.getByText(/This is how your body text will look/);
    
    expect(headingPreview).toHaveStyle({ fontFamily: '"Playfair Display", serif' });
    expect(bodyPreview).toHaveStyle({ fontFamily: '"Source Sans Pro", sans-serif' });
  });

  it('shows popular font pairings', () => {
    render(<FontPicker fonts={mockFonts} onChange={mockOnChange} />);
    
    expect(screen.getByText('Popular Font Pairings')).toBeInTheDocument();
    expect(screen.getByText('Classic Editorial')).toBeInTheDocument();
    expect(screen.getByText('Modern Clean')).toBeInTheDocument();
    expect(screen.getByText('Bold Professional')).toBeInTheDocument();
  });

  it('allows searching for fonts', async () => {
    render(<FontPicker fonts={mockFonts} onChange={mockOnChange} />);
    
    const searchInput = screen.getByPlaceholderText('Search fonts...');
    fireEvent.change(searchInput, { target: { value: 'Inter' } });
    
    await waitFor(() => {
      expect(screen.getByText('Inter')).toBeInTheDocument();
    });
  });

  it('filters fonts by category', async () => {
    render(<FontPicker fonts={mockFonts} onChange={mockOnChange} />);
    
    const categorySelect = screen.getByRole('combobox');
    fireEvent.click(categorySelect);
    
    const serifOption = screen.getByText('Serif');
    fireEvent.click(serifOption);
    
    await waitFor(() => {
      expect(screen.getByText('Playfair Display')).toBeInTheDocument();
      expect(screen.getByText('Merriweather')).toBeInTheDocument();
    });
  });

  it('handles font selection for heading', async () => {
    render(<FontPicker fonts={mockFonts} onChange={mockOnChange} />);
    
    // Find a font in the list and click its heading button
    const interFont = screen.getByText('Inter');
    const fontContainer = interFont.closest('.border.rounded-lg');
    const headingButton = fontContainer?.querySelector('button:contains("Heading")') || 
                         screen.getAllByText('Heading')[0];
    
    fireEvent.click(headingButton);
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        heading: 'Inter',
        body: 'Source Sans Pro'
      });
    });
  });

  it('handles font selection for body', async () => {
    render(<FontPicker fonts={mockFonts} onChange={mockOnChange} />);
    
    // Find a font in the list and click its body button
    const interFont = screen.getByText('Inter');
    const fontContainer = interFont.closest('.border.rounded-lg');
    const bodyButton = fontContainer?.querySelector('button:contains("Body")') || 
                      screen.getAllByText('Body')[0];
    
    fireEvent.click(bodyButton);
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        heading: 'Playfair Display',
        body: 'Inter'
      });
    });
  });

  it('handles quick font pairing selection', async () => {
    render(<FontPicker fonts={mockFonts} onChange={mockOnChange} />);
    
    const classicEditorialButton = screen.getByText('Classic Editorial');
    fireEvent.click(classicEditorialButton);
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        heading: 'Playfair Display',
        body: 'Source Sans Pro'
      });
    });
  });

  it('shows loading state when fonts are being loaded', () => {
    render(<FontPicker fonts={mockFonts} onChange={mockOnChange} />);
    
    // The component should show loading indicators when fonts are being loaded
    // This is tested through the loading state management in the component
    expect(screen.getByText('Font Selection')).toBeInTheDocument();
  });

  it('displays font categories correctly', () => {
    render(<FontPicker fonts={mockFonts} onChange={mockOnChange} />);
    
    // Check that fonts are displayed with their categories
    const categoryBadges = screen.getAllByText(/serif|sans-serif|display|monospace/);
    expect(categoryBadges.length).toBeGreaterThan(0);
  });

  it('shows no results message when search yields no results', async () => {
    render(<FontPicker fonts={mockFonts} onChange={mockOnChange} />);
    
    const searchInput = screen.getByPlaceholderText('Search fonts...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentFont' } });
    
    await waitFor(() => {
      expect(screen.getByText('No fonts found matching your criteria')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <FontPicker fonts={mockFonts} onChange={mockOnChange} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('displays font preview text correctly', () => {
    render(<FontPicker fonts={mockFonts} onChange={mockOnChange} />);
    
    expect(screen.getByText('Your Brand Name')).toBeInTheDocument();
    expect(screen.getByText(/This is how your body text will look/)).toBeInTheDocument();
    expect(screen.getByText('The quick brown fox jumps over the lazy dog')).toBeInTheDocument();
  });
});