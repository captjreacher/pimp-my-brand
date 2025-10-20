import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Crop, 
  Move, 
  Palette, 
  Type, 
  Download, 
  Undo, 
  Redo,
  RotateCw,
  Scissors
} from 'lucide-react'

export interface CropBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface Dimensions {
  width: number
  height: number
}

export interface TextOverlay {
  text: string
  position: { x: number; y: number }
  font: FontConfig
  color: string
  effects: TextEffect[]
}

export interface FontConfig {
  family: string
  size: number
  weight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  style: 'normal' | 'italic'
}

export interface TextEffect {
  type: 'shadow' | 'outline' | 'glow'
  color: string
  intensity: number
}

export interface ImageFilter {
  type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'sepia' | 'grayscale' | 'hue-rotate'
  value: number
}

interface ImageEditorProps {
  initialImage?: string | File
  onSave?: (blob: Blob) => void
  onCancel?: () => void
  className?: string
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  initialImage,
  onSave,
  onCancel,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [cropBounds, setCropBounds] = useState<CropBounds | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [filters, setFilters] = useState<ImageFilter[]>([])
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([])
  const [selectedTool, setSelectedTool] = useState<'crop' | 'resize' | 'filter' | 'text'>('crop')

  // Load initial image
  useEffect(() => {
    if (initialImage) {
      loadImage(initialImage)
    }
  }, [initialImage])

  const loadImage = useCallback(async (source: string | File) => {
    const img = new Image()
    
    if (source instanceof File) {
      const url = URL.createObjectURL(source)
      img.onload = () => {
        URL.revokeObjectURL(url)
        setImage(img)
        drawImageToCanvas(img)
        saveToHistory()
      }
      img.src = url
    } else {
      img.onload = () => {
        setImage(img)
        drawImageToCanvas(img)
        saveToHistory()
      }
      img.src = source
    }
  }, [])

  const drawImageToCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = img.width
    canvas.height = img.height
    
    // Apply filters
    ctx.filter = filters.map(f => {
      switch (f.type) {
        case 'brightness': return `brightness(${f.value}%)`
        case 'contrast': return `contrast(${f.value}%)`
        case 'saturation': return `saturate(${f.value}%)`
        case 'blur': return `blur(${f.value}px)`
        case 'sepia': return `sepia(${f.value}%)`
        case 'grayscale': return `grayscale(${f.value}%)`
        case 'hue-rotate': return `hue-rotate(${f.value}deg)`
        default: return ''
      }
    }).join(' ')

    ctx.drawImage(img, 0, 0)
    
    // Draw text overlays
    textOverlays.forEach(overlay => {
      ctx.font = `${overlay.font.style} ${overlay.font.weight} ${overlay.font.size}px ${overlay.font.family}`
      ctx.fillStyle = overlay.color
      
      // Apply text effects
      overlay.effects.forEach(effect => {
        switch (effect.type) {
          case 'shadow':
            ctx.shadowColor = effect.color
            ctx.shadowBlur = effect.intensity
            ctx.shadowOffsetX = 2
            ctx.shadowOffsetY = 2
            break
          case 'outline':
            ctx.strokeStyle = effect.color
            ctx.lineWidth = effect.intensity
            ctx.strokeText(overlay.text, overlay.position.x, overlay.position.y)
            break
        }
      })
      
      ctx.fillText(overlay.text, overlay.position.x, overlay.position.y)
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    })
  }, [filters, textOverlays])

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(imageData)
    
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const prevImageData = history[historyIndex - 1]
      ctx.putImageData(prevImageData, 0, 0)
      setHistoryIndex(historyIndex - 1)
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const nextImageData = history[historyIndex + 1]
      ctx.putImageData(nextImageData, 0, 0)
      setHistoryIndex(historyIndex + 1)
    }
  }, [history, historyIndex])

  const crop = useCallback(() => {
    if (!cropBounds || !image) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const croppedCanvas = document.createElement('canvas')
    const croppedCtx = croppedCanvas.getContext('2d')
    if (!croppedCtx) return

    croppedCanvas.width = cropBounds.width
    croppedCanvas.height = cropBounds.height

    croppedCtx.drawImage(
      canvas,
      cropBounds.x, cropBounds.y, cropBounds.width, cropBounds.height,
      0, 0, cropBounds.width, cropBounds.height
    )

    canvas.width = cropBounds.width
    canvas.height = cropBounds.height
    ctx.drawImage(croppedCanvas, 0, 0)

    setCropBounds(null)
    setIsCropping(false)
    saveToHistory()
  }, [cropBounds, image])

  const resize = useCallback((dimensions: Dimensions) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    tempCtx.putImageData(imageData, 0, 0)

    canvas.width = dimensions.width
    canvas.height = dimensions.height
    ctx.drawImage(tempCanvas, 0, 0, dimensions.width, dimensions.height)

    saveToHistory()
  }, [])

  const applyFilter = useCallback((filter: ImageFilter) => {
    const existingFilterIndex = filters.findIndex(f => f.type === filter.type)
    
    if (existingFilterIndex >= 0) {
      const newFilters = [...filters]
      newFilters[existingFilterIndex] = filter
      setFilters(newFilters)
    } else {
      setFilters([...filters, filter])
    }

    if (image) {
      drawImageToCanvas(image)
      saveToHistory()
    }
  }, [filters, image, drawImageToCanvas])

  const addText = useCallback((textOverlay: TextOverlay) => {
    setTextOverlays([...textOverlays, textOverlay])
    if (image) {
      drawImageToCanvas(image)
      saveToHistory()
    }
  }, [textOverlays, image, drawImageToCanvas])

  const removeBackground = useCallback(async () => {
    // This would integrate with a background removal service
    // For now, we'll simulate the process
    console.log('Background removal would be implemented here')
    // Implementation would call an AI service for background removal
  }, [])

  const enhanceQuality = useCallback(async () => {
    // This would integrate with an AI enhancement service
    console.log('Quality enhancement would be implemented here')
    // Implementation would call an AI service for image enhancement
  }, [])

  const exportImage = useCallback((format: 'png' | 'jpg' | 'svg' = 'png') => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (blob && onSave) {
        onSave(blob)
      }
    }, `image/${format}`)
  }, [onSave])

  return (
    <div className={`image-editor ${className}`}>
      <div className="flex gap-4 mb-4">
        <Button
          variant={selectedTool === 'crop' ? 'default' : 'outline'}
          onClick={() => setSelectedTool('crop')}
        >
          <Crop className="w-4 h-4 mr-2" />
          Crop
        </Button>
        <Button
          variant={selectedTool === 'resize' ? 'default' : 'outline'}
          onClick={() => setSelectedTool('resize')}
        >
          <Move className="w-4 h-4 mr-2" />
          Resize
        </Button>
        <Button
          variant={selectedTool === 'filter' ? 'default' : 'outline'}
          onClick={() => setSelectedTool('filter')}
        >
          <Palette className="w-4 h-4 mr-2" />
          Filters
        </Button>
        <Button
          variant={selectedTool === 'text' ? 'default' : 'outline'}
          onClick={() => setSelectedTool('text')}
        >
          <Type className="w-4 h-4 mr-2" />
          Text
        </Button>
        <Button onClick={removeBackground} variant="outline">
          <Scissors className="w-4 h-4 mr-2" />
          Remove BG
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 max-w-full max-h-96"
            style={{ cursor: isCropping ? 'crosshair' : 'default' }}
          />
        </div>

        <Card className="w-80">
          <CardHeader>
            <CardTitle>Tools</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={undo} disabled={historyIndex <= 0}>
                <Undo className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                <Redo className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => exportImage('png')}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTool} onValueChange={(value) => setSelectedTool(value as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="crop">Crop</TabsTrigger>
                <TabsTrigger value="resize">Size</TabsTrigger>
                <TabsTrigger value="filter">Filter</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
              </TabsList>

              <TabsContent value="crop" className="space-y-4">
                <Button 
                  onClick={() => setIsCropping(!isCropping)}
                  variant={isCropping ? 'default' : 'outline'}
                  className="w-full"
                >
                  {isCropping ? 'Cancel Crop' : 'Start Cropping'}
                </Button>
                {cropBounds && (
                  <Button onClick={crop} className="w-full">
                    Apply Crop
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="resize" className="space-y-4">
                <div>
                  <Label>Width</Label>
                  <Input type="number" placeholder="Width" />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input type="number" placeholder="Height" />
                </div>
                <Button className="w-full">Apply Resize</Button>
              </TabsContent>

              <TabsContent value="filter" className="space-y-4">
                {['brightness', 'contrast', 'saturation', 'blur'].map((filterType) => (
                  <div key={filterType}>
                    <Label className="capitalize">{filterType}</Label>
                    <Slider
                      defaultValue={[100]}
                      max={200}
                      min={0}
                      step={1}
                      onValueChange={(value) => 
                        applyFilter({ type: filterType as any, value: value[0] })
                      }
                    />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="text" className="space-y-4">
                <Input placeholder="Enter text" />
                <div>
                  <Label>Font Size</Label>
                  <Slider defaultValue={[16]} max={72} min={8} step={1} />
                </div>
                <Input type="color" defaultValue="#000000" />
                <Button className="w-full">Add Text</Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 mt-4">
        <Button onClick={() => exportImage('png')} className="flex-1">
          Save as PNG
        </Button>
        <Button onClick={() => exportImage('jpg')} variant="outline" className="flex-1">
          Save as JPG
        </Button>
        {onCancel && (
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}