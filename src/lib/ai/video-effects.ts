import { AnimationConfig } from './types'

export interface VideoEffect {
  id: string
  name: string
  description: string
  type: 'transition' | 'overlay' | 'filter' | 'animation'
  previewUrl?: string
  parameters: EffectParameter[]
}

export interface EffectParameter {
  name: string
  type: 'number' | 'string' | 'boolean' | 'color' | 'select'
  defaultValue: any
  min?: number
  max?: number
  step?: number
  options?: string[]
  description?: string
}

export interface AppliedEffect {
  effectId: string
  timing: {
    start: number
    duration: number
  }
  parameters: Record<string, any>
  layer: number
}

export class VideoEffectsService {
  private static readonly AVAILABLE_EFFECTS: VideoEffect[] = [
    // Transition Effects
    {
      id: 'fade-in',
      name: 'Fade In',
      description: 'Gradually fade in from transparent to opaque',
      type: 'transition',
      parameters: [
        {
          name: 'duration',
          type: 'number',
          defaultValue: 1.0,
          min: 0.1,
          max: 3.0,
          step: 0.1,
          description: 'Fade duration in seconds'
        },
        {
          name: 'easing',
          type: 'select',
          defaultValue: 'ease-in',
          options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'],
          description: 'Animation easing function'
        }
      ]
    },
    {
      id: 'fade-out',
      name: 'Fade Out',
      description: 'Gradually fade out from opaque to transparent',
      type: 'transition',
      parameters: [
        {
          name: 'duration',
          type: 'number',
          defaultValue: 1.0,
          min: 0.1,
          max: 3.0,
          step: 0.1,
          description: 'Fade duration in seconds'
        },
        {
          name: 'easing',
          type: 'select',
          defaultValue: 'ease-out',
          options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'],
          description: 'Animation easing function'
        }
      ]
    },
    {
      id: 'slide-in',
      name: 'Slide In',
      description: 'Slide in from specified direction',
      type: 'transition',
      parameters: [
        {
          name: 'direction',
          type: 'select',
          defaultValue: 'left',
          options: ['left', 'right', 'top', 'bottom'],
          description: 'Slide direction'
        },
        {
          name: 'distance',
          type: 'number',
          defaultValue: 100,
          min: 10,
          max: 500,
          step: 10,
          description: 'Slide distance in pixels'
        },
        {
          name: 'duration',
          type: 'number',
          defaultValue: 0.8,
          min: 0.1,
          max: 2.0,
          step: 0.1,
          description: 'Animation duration in seconds'
        }
      ]
    },
    {
      id: 'zoom-in',
      name: 'Zoom In',
      description: 'Scale up from smaller to normal size',
      type: 'animation',
      parameters: [
        {
          name: 'startScale',
          type: 'number',
          defaultValue: 0.8,
          min: 0.1,
          max: 1.0,
          step: 0.1,
          description: 'Starting scale factor'
        },
        {
          name: 'endScale',
          type: 'number',
          defaultValue: 1.0,
          min: 1.0,
          max: 2.0,
          step: 0.1,
          description: 'Ending scale factor'
        },
        {
          name: 'duration',
          type: 'number',
          defaultValue: 1.5,
          min: 0.5,
          max: 3.0,
          step: 0.1,
          description: 'Animation duration in seconds'
        }
      ]
    },
    {
      id: 'zoom-out',
      name: 'Zoom Out',
      description: 'Scale down from normal to smaller size',
      type: 'animation',
      parameters: [
        {
          name: 'startScale',
          type: 'number',
          defaultValue: 1.0,
          min: 1.0,
          max: 2.0,
          step: 0.1,
          description: 'Starting scale factor'
        },
        {
          name: 'endScale',
          type: 'number',
          defaultValue: 0.8,
          min: 0.1,
          max: 1.0,
          step: 0.1,
          description: 'Ending scale factor'
        },
        {
          name: 'duration',
          type: 'number',
          defaultValue: 1.5,
          min: 0.5,
          max: 3.0,
          step: 0.1,
          description: 'Animation duration in seconds'
        }
      ]
    },

    // Text Overlay Effects
    {
      id: 'text-overlay',
      name: 'Text Overlay',
      description: 'Add animated text overlay to video',
      type: 'overlay',
      parameters: [
        {
          name: 'text',
          type: 'string',
          defaultValue: 'Your Brand',
          description: 'Text to display'
        },
        {
          name: 'position',
          type: 'select',
          defaultValue: 'bottom',
          options: ['top', 'center', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
          description: 'Text position on screen'
        },
        {
          name: 'fontSize',
          type: 'number',
          defaultValue: 24,
          min: 12,
          max: 72,
          step: 2,
          description: 'Font size in pixels'
        },
        {
          name: 'fontWeight',
          type: 'select',
          defaultValue: 'bold',
          options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
          description: 'Font weight'
        },
        {
          name: 'color',
          type: 'color',
          defaultValue: '#ffffff',
          description: 'Text color'
        },
        {
          name: 'backgroundColor',
          type: 'color',
          defaultValue: 'rgba(0,0,0,0.5)',
          description: 'Background color (optional)'
        },
        {
          name: 'animation',
          type: 'select',
          defaultValue: 'fade-in',
          options: ['none', 'fade-in', 'slide-up', 'typewriter'],
          description: 'Text animation style'
        }
      ]
    },
    {
      id: 'logo-overlay',
      name: 'Logo Overlay',
      description: 'Add brand logo overlay to video',
      type: 'overlay',
      parameters: [
        {
          name: 'logoUrl',
          type: 'string',
          defaultValue: '',
          description: 'Logo image URL'
        },
        {
          name: 'position',
          type: 'select',
          defaultValue: 'top-right',
          options: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'],
          description: 'Logo position on screen'
        },
        {
          name: 'size',
          type: 'number',
          defaultValue: 80,
          min: 20,
          max: 200,
          step: 10,
          description: 'Logo size in pixels'
        },
        {
          name: 'opacity',
          type: 'number',
          defaultValue: 0.8,
          min: 0.1,
          max: 1.0,
          step: 0.1,
          description: 'Logo opacity'
        }
      ]
    },

    // Filter Effects
    {
      id: 'blur-background',
      name: 'Blur Background',
      description: 'Apply blur effect to background while keeping avatar sharp',
      type: 'filter',
      parameters: [
        {
          name: 'intensity',
          type: 'number',
          defaultValue: 5,
          min: 1,
          max: 20,
          step: 1,
          description: 'Blur intensity'
        },
        {
          name: 'fadeIn',
          type: 'boolean',
          defaultValue: true,
          description: 'Gradually apply blur effect'
        }
      ]
    },
    {
      id: 'color-grade',
      name: 'Color Grading',
      description: 'Adjust video colors and mood',
      type: 'filter',
      parameters: [
        {
          name: 'brightness',
          type: 'number',
          defaultValue: 0,
          min: -50,
          max: 50,
          step: 5,
          description: 'Brightness adjustment'
        },
        {
          name: 'contrast',
          type: 'number',
          defaultValue: 0,
          min: -50,
          max: 50,
          step: 5,
          description: 'Contrast adjustment'
        },
        {
          name: 'saturation',
          type: 'number',
          defaultValue: 0,
          min: -100,
          max: 100,
          step: 10,
          description: 'Saturation adjustment'
        },
        {
          name: 'warmth',
          type: 'number',
          defaultValue: 0,
          min: -50,
          max: 50,
          step: 5,
          description: 'Color temperature adjustment'
        }
      ]
    },
    {
      id: 'vignette',
      name: 'Vignette',
      description: 'Add dark edges to focus attention on center',
      type: 'filter',
      parameters: [
        {
          name: 'intensity',
          type: 'number',
          defaultValue: 0.3,
          min: 0.1,
          max: 1.0,
          step: 0.1,
          description: 'Vignette intensity'
        },
        {
          name: 'size',
          type: 'number',
          defaultValue: 0.7,
          min: 0.3,
          max: 1.0,
          step: 0.1,
          description: 'Vignette size'
        }
      ]
    }
  ]

  getAvailableEffects(): VideoEffect[] {
    return VideoEffectsService.AVAILABLE_EFFECTS
  }

  getEffectsByType(type: VideoEffect['type']): VideoEffect[] {
    return VideoEffectsService.AVAILABLE_EFFECTS.filter(effect => effect.type === type)
  }

  getEffectById(id: string): VideoEffect | undefined {
    return VideoEffectsService.AVAILABLE_EFFECTS.find(effect => effect.id === id)
  }

  createAppliedEffect(
    effectId: string,
    startTime: number,
    duration: number,
    parameters: Record<string, any> = {},
    layer: number = 0
  ): AppliedEffect {
    const effect = this.getEffectById(effectId)
    if (!effect) {
      throw new Error(`Effect with id '${effectId}' not found`)
    }

    // Merge with default parameters
    const effectParameters = { ...parameters }
    effect.parameters.forEach(param => {
      if (!(param.name in effectParameters)) {
        effectParameters[param.name] = param.defaultValue
      }
    })

    return {
      effectId,
      timing: { start: startTime, duration },
      parameters: effectParameters,
      layer
    }
  }

  validateEffectParameters(effectId: string, parameters: Record<string, any>): string[] {
    const effect = this.getEffectById(effectId)
    if (!effect) {
      return [`Effect with id '${effectId}' not found`]
    }

    const errors: string[] = []

    effect.parameters.forEach(param => {
      const value = parameters[param.name]
      
      if (value === undefined || value === null) {
        errors.push(`Parameter '${param.name}' is required`)
        return
      }

      switch (param.type) {
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`Parameter '${param.name}' must be a number`)
          } else {
            if (param.min !== undefined && value < param.min) {
              errors.push(`Parameter '${param.name}' must be at least ${param.min}`)
            }
            if (param.max !== undefined && value > param.max) {
              errors.push(`Parameter '${param.name}' must be at most ${param.max}`)
            }
          }
          break
        
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`Parameter '${param.name}' must be a string`)
          }
          break
        
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Parameter '${param.name}' must be a boolean`)
          }
          break
        
        case 'select':
          if (param.options && !param.options.includes(value)) {
            errors.push(`Parameter '${param.name}' must be one of: ${param.options.join(', ')}`)
          }
          break
        
        case 'color':
          if (typeof value !== 'string' || !this.isValidColor(value)) {
            errors.push(`Parameter '${param.name}' must be a valid color`)
          }
          break
      }
    })

    return errors
  }

  private isValidColor(color: string): boolean {
    // Basic color validation (hex, rgb, rgba, named colors)
    const colorRegex = /^(#[0-9A-Fa-f]{3,8}|rgb\(.*\)|rgba\(.*\)|[a-zA-Z]+)$/
    return colorRegex.test(color)
  }

  convertToAnimationConfig(appliedEffect: AppliedEffect): AnimationConfig {
    const effect = this.getEffectById(appliedEffect.effectId)
    if (!effect) {
      throw new Error(`Effect with id '${appliedEffect.effectId}' not found`)
    }

    // Convert effect to animation config format
    let type: AnimationConfig['type']
    
    switch (appliedEffect.effectId) {
      case 'fade-in':
      case 'fade-out':
        type = 'fade'
        break
      case 'slide-in':
        type = 'slide'
        break
      case 'zoom-in':
      case 'zoom-out':
        type = 'zoom'
        break
      case 'text-overlay':
      case 'logo-overlay':
        type = 'text_overlay'
        break
      default:
        type = 'fade' // fallback
    }

    return {
      type,
      timing: appliedEffect.timing,
      properties: {
        ...appliedEffect.parameters,
        effectId: appliedEffect.effectId,
        layer: appliedEffect.layer
      }
    }
  }

  generateEffectTimeline(effects: AppliedEffect[], videoDuration: number): AppliedEffect[] {
    // Sort effects by start time and layer
    const sortedEffects = [...effects].sort((a, b) => {
      if (a.timing.start !== b.timing.start) {
        return a.timing.start - b.timing.start
      }
      return a.layer - b.layer
    })

    // Validate timing
    const validatedEffects = sortedEffects.filter(effect => {
      const endTime = effect.timing.start + effect.timing.duration
      return effect.timing.start >= 0 && endTime <= videoDuration
    })

    return validatedEffects
  }

  getRecommendedEffects(videoDuration: number, avatarStyle: string): AppliedEffect[] {
    const recommendations: AppliedEffect[] = []

    // Add fade-in at the beginning
    recommendations.push(
      this.createAppliedEffect('fade-in', 0, 1.0, { duration: 1.0, easing: 'ease-in' }, 0)
    )

    // Add zoom effect in the middle
    const zoomStart = Math.max(2, videoDuration * 0.3)
    recommendations.push(
      this.createAppliedEffect('zoom-in', zoomStart, 2.0, { 
        startScale: 1.0, 
        endScale: 1.1, 
        duration: 2.0 
      }, 1)
    )

    // Add text overlay
    const textStart = Math.max(1, videoDuration * 0.2)
    recommendations.push(
      this.createAppliedEffect('text-overlay', textStart, videoDuration - textStart - 1, {
        text: 'Your Brand',
        position: 'bottom',
        fontSize: 28,
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.6)',
        animation: 'fade-in'
      }, 2)
    )

    // Add fade-out at the end
    const fadeOutStart = Math.max(videoDuration - 1, 0)
    recommendations.push(
      this.createAppliedEffect('fade-out', fadeOutStart, 1.0, { duration: 1.0, easing: 'ease-out' }, 3)
    )

    return recommendations
  }
}