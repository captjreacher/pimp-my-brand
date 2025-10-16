import { useState, useCallback } from 'react';
import { ColorSwatch } from '@/lib/ai/types';
import { AccessibleButton } from '@/components/ui/accessible-button';
import { AccessibleInput } from '@/components/ui/accessible-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Palette, Plus, X, AlertTriangle } from 'lucide-react';
import { calculateContrastRatio } from '@/lib/accessibility/utils';
import { useScreenReader } from '@/hooks/use-accessibility';

interface PalettePickerProps {
  palette: ColorSwatch[];
  onChange: (palette: ColorSwatch[]) => void;
  maxColors?: number;
  className?: string;
}

interface ContrastResult {
  ratio: number;
  level: 'AAA' | 'AA' | 'A' | 'FAIL';
  passes: boolean;
}

interface ContrastResult {
  ratio: number;
  level: 'AAA' | 'AA' | 'A' | 'FAIL';
  passes: boolean;
}

/**
 * Get contrast result using the accessibility utils
 */
function getContrastResult(color1: string, color2: string): ContrastResult {
  const ratio = calculateContrastRatio(color1, color2);
  
  let level: ContrastResult['level'] = 'FAIL';
  let passes = false;

  if (ratio >= 7) {
    level = 'AAA';
    passes = true;
  } else if (ratio >= 4.5) {
    level = 'AA';
    passes = true;
  } else if (ratio >= 3) {
    level = 'A';
    passes = false;
  }

  return { ratio, level, passes };
}

/**
 * Generate a color wheel using HSL color space
 */
function generateColorWheel(): string[] {
  const colors: string[] = [];
  const saturation = 70;
  const lightness = 50;
  
  // Generate 24 colors around the color wheel
  for (let i = 0; i < 24; i++) {
    const hue = (i * 15) % 360;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  
  return colors;
}

/**
 * Convert HSL to hex
 */
function hslToHex(hsl: string): string {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return '#000000';
  
  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;
  
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r: number, g: number, b: number;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function PalettePicker({ 
  palette, 
  onChange, 
  maxColors = 8,
  className = '' 
}: PalettePickerProps) {
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [showColorWheel, setShowColorWheel] = useState(false);
  const { announce } = useScreenReader();
  
  const colorWheelColors = generateColorWheel();

  const handleAddColor = useCallback(() => {
    if (newColorName.trim() && newColorHex && palette.length < maxColors) {
      const newColor: ColorSwatch = {
        name: newColorName.trim(),
        hex: newColorHex
      };
      
      onChange([...palette, newColor]);
      setNewColorName('');
      setNewColorHex('#000000');
      announce(`Added ${newColor.name} color to palette`, 'polite');
    }
  }, [newColorName, newColorHex, palette, maxColors, onChange, announce]);

  const handleRemoveColor = useCallback((index: number) => {
    const colorName = palette[index]?.name;
    const newPalette = palette.filter((_, i) => i !== index);
    onChange(newPalette);
    if (colorName) {
      announce(`Removed ${colorName} from palette`, 'polite');
    }
  }, [palette, onChange, announce]);

  const handleColorChange = useCallback((index: number, field: 'name' | 'hex', value: string) => {
    const newPalette = [...palette];
    newPalette[index] = { ...newPalette[index], [field]: value };
    onChange(newPalette);
  }, [palette, onChange]);

  const handleWheelColorSelect = useCallback((hslColor: string) => {
    const hexColor = hslToHex(hslColor);
    setNewColorHex(hexColor);
    setShowColorWheel(false);
  }, []);

  // Check contrast ratios for accessibility
  const getContrastWarnings = useCallback(() => {
    const warnings: string[] = [];
    
    for (let i = 0; i < palette.length; i++) {
      for (let j = i + 1; j < palette.length; j++) {
        const contrast = getContrastResult(palette[i].hex, palette[j].hex);
        if (!contrast.passes) {
          warnings.push(
            `${palette[i].name} and ${palette[j].name} have low contrast (${contrast.ratio.toFixed(2)}:1)`
          );
        }
      }
    }
    
    return warnings;
  }, [palette]);

  const contrastWarnings = getContrastWarnings();

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Color Palette
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Palette */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Current Colors</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list" aria-label="Current color palette">
            {palette.map((color, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg" role="listitem">
                <div 
                  className="w-12 h-12 rounded-md border-2 border-gray-200 flex-shrink-0"
                  style={{ backgroundColor: color.hex }}
                  role="img"
                  aria-label={`Color swatch for ${color.name || 'unnamed color'}`}
                />
                <div className="flex-1 space-y-2">
                  <AccessibleInput
                    label={`Color ${index + 1} name`}
                    hideLabel
                    value={color.name}
                    onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                    placeholder="Color name"
                    className="h-8"
                  />
                  <input
                    type="color"
                    value={color.hex}
                    onChange={(e) => handleColorChange(index, 'hex', e.target.value)}
                    className="h-8 w-full rounded border border-input"
                    aria-label={`Color ${index + 1} hex value`}
                  />
                </div>
                <AccessibleButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveColor(index)}
                  className="text-red-500 hover:text-red-700"
                  aria-label={`Remove ${color.name || 'color'} from palette`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </AccessibleButton>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Color */}
        {palette.length < maxColors && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Add New Color</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <AccessibleInput
                label="New color name"
                hideLabel
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Color name (e.g., Primary, Accent)"
                className="flex-1"
                required
              />
              <div className="flex gap-2">
                <div className="relative">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-16 h-10 rounded border border-input"
                    aria-label="New color hex value"
                  />
                </div>
                <AccessibleButton
                  variant="outline"
                  onClick={() => setShowColorWheel(!showColorWheel)}
                  className="px-3"
                  aria-label={showColorWheel ? "Hide color wheel" : "Show color wheel"}
                  expanded={showColorWheel}
                >
                  <Palette className="h-4 w-4" aria-hidden="true" />
                </AccessibleButton>
                <AccessibleButton 
                  onClick={handleAddColor}
                  disabled={!newColorName.trim() || palette.length >= maxColors}
                  aria-describedby="add-color-help"
                >
                  <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                  Add
                </AccessibleButton>
              </div>
            </div>
            <p id="add-color-help" className="text-xs text-muted-foreground">
              {palette.length >= maxColors 
                ? `Maximum of ${maxColors} colors allowed`
                : `${maxColors - palette.length} more colors can be added`
              }
            </p>
            
            {/* Color Wheel */}
            {showColorWheel && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <Label className="text-sm font-medium mb-3 block">Quick Color Selection</Label>
                <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
                  {colorWheelColors.map((color, index) => (
                    <button
                      key={index}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => handleWheelColorSelect(color)}
                      title={`Hue ${index * 15}°`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Accessibility Warnings */}
        {contrastWarnings.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Accessibility Warnings
            </Label>
            <div className="space-y-1">
              {contrastWarnings.map((warning, index) => (
                <Badge key={index} variant="outline" className="text-amber-700 border-amber-300">
                  {warning}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-600">
              WCAG AA requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text.
            </p>
          </div>
        )}

        {/* Palette Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Palette Preview</Label>
          <div className="flex flex-wrap gap-2">
            {palette.map((color, index) => (
              <div key={index} className="text-center">
                <div 
                  className="w-16 h-16 rounded-lg border-2 border-gray-200 mb-1"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="text-xs text-gray-600 max-w-16 truncate">
                  {color.name}
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  {color.hex.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}