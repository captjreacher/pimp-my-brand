import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { FontPair } from '@/lib/ai/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type, Search, Loader2, RefreshCw } from 'lucide-react';

interface FontPickerProps {
  fonts: FontPair;
  onChange: (fonts: FontPair) => void;
  className?: string;
}

interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  category: string;
}

// Popular Google Fonts categorized by type
const POPULAR_FONTS: Record<string, GoogleFont[]> = {
  'serif': [
    { family: 'Playfair Display', variants: ['400', '700'], subsets: ['latin'], category: 'serif' },
    { family: 'Merriweather', variants: ['400', '700'], subsets: ['latin'], category: 'serif' },
    { family: 'Crimson Text', variants: ['400', '600'], subsets: ['latin'], category: 'serif' },
    { family: 'Libre Baskerville', variants: ['400', '700'], subsets: ['latin'], category: 'serif' },
    { family: 'Cormorant Garamond', variants: ['400', '600'], subsets: ['latin'], category: 'serif' },
  ],
  'sans-serif': [
    { family: 'Inter', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Roboto', variants: ['400', '500', '700'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Open Sans', variants: ['400', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Lato', variants: ['400', '700'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Montserrat', variants: ['400', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Source Sans Pro', variants: ['400', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Nunito', variants: ['400', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Poppins', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
  ],
  'display': [
    { family: 'Oswald', variants: ['400', '600'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Raleway', variants: ['400', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Bebas Neue', variants: ['400'], subsets: ['latin'], category: 'display' },
    { family: 'Anton', variants: ['400'], subsets: ['latin'], category: 'sans-serif' },
  ],
  'monospace': [
    { family: 'JetBrains Mono', variants: ['400', '500'], subsets: ['latin'], category: 'monospace' },
    { family: 'Fira Code', variants: ['400', '500'], subsets: ['latin'], category: 'monospace' },
    { family: 'Source Code Pro', variants: ['400', '500'], subsets: ['latin'], category: 'monospace' },
  ]
};

// Font loading cache
const fontLoadCache = new Set<string>();
const fontLoadPromises = new Map<string, Promise<void>>();

/**
 * Load a Google Font dynamically
 */
function loadGoogleFont(fontFamily: string, weights: string[] = ['400']): Promise<void> {
  const cacheKey = `${fontFamily}:${weights.join(',')}`;
  
  if (fontLoadCache.has(cacheKey)) {
    return Promise.resolve();
  }
  
  if (fontLoadPromises.has(cacheKey)) {
    return fontLoadPromises.get(cacheKey)!;
  }
  
  const promise = new Promise<void>((resolve, reject) => {
    // Create font face declarations
    const weightsParam = weights.join(',');
    const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weightsParam}&display=swap`;
    
    // Check if link already exists
    const existingLink = document.querySelector(`link[href*="${encodeURIComponent(fontFamily)}"]`);
    if (existingLink) {
      fontLoadCache.add(cacheKey);
      resolve();
      return;
    }
    
    // Create and append link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    
    link.onload = () => {
      fontLoadCache.add(cacheKey);
      resolve();
    };
    
    link.onerror = () => {
      reject(new Error(`Failed to load font: ${fontFamily}`));
    };
    
    document.head.appendChild(link);
  });
  
  fontLoadPromises.set(cacheKey, promise);
  return promise;
}

/**
 * Get font suggestions based on category and pairing rules
 */
function getFontSuggestions(currentFont: string, type: 'heading' | 'body'): GoogleFont[] {
  const allFonts = Object.values(POPULAR_FONTS).flat();
  const currentFontData = allFonts.find(f => f.family === currentFont);
  
  if (type === 'heading') {
    // For headings, suggest display fonts and serif fonts
    return [...POPULAR_FONTS.display, ...POPULAR_FONTS.serif.slice(0, 3)];
  } else {
    // For body text, suggest sans-serif fonts that pair well
    if (currentFontData?.category === 'serif') {
      // If heading is serif, suggest clean sans-serif for body
      return POPULAR_FONTS['sans-serif'].slice(0, 6);
    } else {
      // If heading is sans-serif or display, suggest readable fonts
      return [...POPULAR_FONTS['sans-serif'].slice(0, 4), ...POPULAR_FONTS.serif.slice(0, 2)];
    }
  }
}

export function FontPicker({ fonts, onChange, className = '' }: FontPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingFonts, setLoadingFonts] = useState<Set<string>>(new Set());
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Sample text for font preview
  const sampleTexts = {
    heading: 'Your Brand Name',
    body: 'This is how your body text will look in documents and presentations. It should be clear and readable.'
  };
  
  // Get all available fonts
  const allFonts = useMemo(() => {
    return Object.values(POPULAR_FONTS).flat();
  }, []);
  
  // Filter fonts based on search and category
  const filteredFonts = useMemo(() => {
    let fonts = allFonts;
    
    if (selectedCategory !== 'all') {
      fonts = POPULAR_FONTS[selectedCategory] || [];
    }
    
    if (searchTerm) {
      fonts = fonts.filter(font => 
        font.family.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return fonts;
  }, [allFonts, selectedCategory, searchTerm]);
  
  // Load current fonts on mount
  useEffect(() => {
    const loadCurrentFonts = async () => {
      try {
        await Promise.all([
          loadGoogleFont(fonts.heading, ['400', '600', '700']),
          loadGoogleFont(fonts.body, ['400', '500'])
        ]);
        setLoadedFonts(prev => new Set([...prev, fonts.heading, fonts.body]));
      } catch (error) {
        console.warn('Failed to load current fonts:', error);
      }
    };
    
    loadCurrentFonts();
  }, [fonts.heading, fonts.body]);
  
  const handleFontChange = useCallback(async (type: 'heading' | 'body', fontFamily: string) => {
    // Start loading the font
    setLoadingFonts(prev => new Set([...prev, fontFamily]));
    
    try {
      const weights = type === 'heading' ? ['400', '600', '700'] : ['400', '500'];
      await loadGoogleFont(fontFamily, weights);
      
      setLoadedFonts(prev => new Set([...prev, fontFamily]));
      
      // Update the font pair
      const newFonts = {
        ...fonts,
        [type]: fontFamily
      };
      onChange(newFonts);
    } catch (error) {
      console.error(`Failed to load font ${fontFamily}:`, error);
    } finally {
      setLoadingFonts(prev => {
        const newSet = new Set(prev);
        newSet.delete(fontFamily);
        return newSet;
      });
    }
  }, [fonts, onChange]);
  
  const handleQuickPair = useCallback((headingFont: string, bodyFont: string) => {
    const newFonts: FontPair = {
      heading: headingFont,
      body: bodyFont
    };
    
    // Load both fonts
    Promise.all([
      loadGoogleFont(headingFont, ['400', '600', '700']),
      loadGoogleFont(bodyFont, ['400', '500'])
    ]).then(() => {
      setLoadedFonts(prev => new Set([...prev, headingFont, bodyFont]));
    }).catch(error => {
      console.warn('Failed to load font pair:', error);
    });
    
    onChange(newFonts);
  }, [onChange]);
  
  // Popular font pairings
  const popularPairings = [
    { heading: 'Playfair Display', body: 'Source Sans Pro', name: 'Classic Editorial' },
    { heading: 'Montserrat', body: 'Open Sans', name: 'Modern Clean' },
    { heading: 'Oswald', body: 'Lato', name: 'Bold Professional' },
    { heading: 'Merriweather', body: 'Inter', name: 'Readable Elegant' },
    { heading: 'Raleway', body: 'Nunito', name: 'Friendly Modern' },
  ];

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Font Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Font Pair Preview */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Current Font Pair</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Heading Font */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Heading Font</Label>
                {loadingFonts.has(fonts.heading) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
              <div 
                className="text-2xl font-semibold leading-tight"
                style={{ fontFamily: `"${fonts.heading}", serif` }}
              >
                {sampleTexts.heading}
              </div>
              <Badge variant="outline" className="text-xs">
                {fonts.heading}
              </Badge>
            </div>
            
            {/* Body Font */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Body Font</Label>
                {loadingFonts.has(fonts.body) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
              <div 
                className="text-sm leading-relaxed"
                style={{ fontFamily: `"${fonts.body}", sans-serif` }}
              >
                {sampleTexts.body}
              </div>
              <Badge variant="outline" className="text-xs">
                {fonts.body}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Font Pairings */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Popular Font Pairings</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {popularPairings.map((pairing, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-3 flex flex-col items-start text-left"
                onClick={() => handleQuickPair(pairing.heading, pairing.body)}
              >
                <div className="text-sm font-medium mb-1">{pairing.name}</div>
                <div className="text-xs text-gray-600">
                  {pairing.heading} + {pairing.body}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Font Browser */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Browse Fonts</Label>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search fonts..."
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sans-serif">Sans Serif</SelectItem>
                <SelectItem value="serif">Serif</SelectItem>
                <SelectItem value="display">Display</SelectItem>
                <SelectItem value="monospace">Monospace</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Font List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredFonts.map((font) => (
              <div key={font.family} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{font.family}</div>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {font.category}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFontChange('heading', font.family)}
                      disabled={loadingFonts.has(font.family)}
                    >
                      {loadingFonts.has(font.family) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Heading'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFontChange('body', font.family)}
                      disabled={loadingFonts.has(font.family)}
                    >
                      {loadingFonts.has(font.family) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Body'
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Font Preview */}
                <div className="space-y-2">
                  <div 
                    className="text-lg font-semibold"
                    style={{ fontFamily: `"${font.family}", ${font.category}` }}
                  >
                    {sampleTexts.heading}
                  </div>
                  <div 
                    className="text-sm text-gray-600"
                    style={{ fontFamily: `"${font.family}", ${font.category}` }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredFonts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No fonts found matching your criteria
            </div>
          )}
        </div>

        {/* Font Loading Status */}
        {loadingFonts.size > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading fonts...
          </div>
        )}
      </CardContent>
    </Card>
  );
}