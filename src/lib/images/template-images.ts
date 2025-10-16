// Template image management system
export interface TemplateImage {
  url: string;
  alt: string;
  category: 'avatar' | 'background' | 'logo' | 'accent';
  format: string;
}

export interface TemplateImageSet {
  fictional: TemplateImage;
  personalized?: TemplateImage;
  fallback: TemplateImage;
}

// High-quality stock images for different template formats
export const TEMPLATE_IMAGES: Record<string, Record<string, TemplateImageSet>> = {
  ufc: {
    avatar: {
      fictional: {
        url: "https://images.unsplash.com/photo-1559114367-ff25e89adb7d?auto=format&fit=crop&w=640&q=80",
        alt: "MMA fighter in full walkout gear",
        category: 'avatar',
        format: 'ufc'
      },
      personalized: {
        url: "https://images.unsplash.com/photo-1549451371-64aa98a6f660?auto=format&fit=crop&w=640&q=80",
        alt: "Professional fighter portrait",
        category: 'avatar',
        format: 'ufc'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=640&q=80",
        alt: "Athletic silhouette",
        category: 'avatar',
        format: 'ufc'
      }
    },
    background: {
      fictional: {
        url: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=crop&w=1200&q=80",
        alt: "UFC octagon arena",
        category: 'background',
        format: 'ufc'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
        alt: "Sports arena background",
        category: 'background',
        format: 'ufc'
      }
    }
  },
  team: {
    avatar: {
      fictional: {
        url: "https://images.unsplash.com/photo-1546525848-3ce03ca516f6?auto=format&fit=crop&w=640&q=80",
        alt: "Team captain in uniform",
        category: 'avatar',
        format: 'team'
      },
      personalized: {
        url: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=640&q=80",
        alt: "Professional athlete portrait",
        category: 'avatar',
        format: 'team'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=640&q=80",
        alt: "Athletic silhouette",
        category: 'avatar',
        format: 'team'
      }
    },
    background: {
      fictional: {
        url: "https://images.unsplash.com/photo-1546525848-3ce03ca516f6?auto=format&fit=crop&w=1200&q=80",
        alt: "Basketball court",
        category: 'background',
        format: 'team'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
        alt: "Sports venue background",
        category: 'background',
        format: 'team'
      }
    }
  },
  nfl: {
    avatar: {
      fictional: {
        url: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=640&q=80",
        alt: "NFL player in uniform",
        category: 'avatar',
        format: 'nfl'
      },
      personalized: {
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=640&q=80",
        alt: "Professional football player",
        category: 'avatar',
        format: 'nfl'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=640&q=80",
        alt: "Athletic silhouette",
        category: 'avatar',
        format: 'nfl'
      }
    },
    background: {
      fictional: {
        url: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=1200&q=80",
        alt: "NFL stadium",
        category: 'background',
        format: 'nfl'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
        alt: "Stadium background",
        category: 'background',
        format: 'nfl'
      }
    }
  },
  executive: {
    avatar: {
      fictional: {
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=640&q=80",
        alt: "Professional executive portrait",
        category: 'avatar',
        format: 'executive'
      },
      personalized: {
        url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=640&q=80",
        alt: "Business professional headshot",
        category: 'avatar',
        format: 'executive'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=640&q=80",
        alt: "Professional silhouette",
        category: 'avatar',
        format: 'executive'
      }
    },
    background: {
      fictional: {
        url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
        alt: "Modern office environment",
        category: 'background',
        format: 'executive'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
        alt: "Corporate background",
        category: 'background',
        format: 'executive'
      }
    }
  },
  influencer: {
    avatar: {
      fictional: {
        url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=640&q=80",
        alt: "Content creator portrait",
        category: 'avatar',
        format: 'influencer'
      },
      personalized: {
        url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=640&q=80",
        alt: "Influencer headshot",
        category: 'avatar',
        format: 'influencer'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=640&q=80",
        alt: "Creator silhouette",
        category: 'avatar',
        format: 'influencer'
      }
    },
    background: {
      fictional: {
        url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=1200&q=80",
        alt: "Content creation studio",
        category: 'background',
        format: 'influencer'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
        alt: "Creative background",
        category: 'background',
        format: 'influencer'
      }
    }
  },
  artist: {
    avatar: {
      fictional: {
        url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=640&q=80",
        alt: "Artist portrait",
        category: 'avatar',
        format: 'artist'
      },
      personalized: {
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=640&q=80",
        alt: "Creative professional headshot",
        category: 'avatar',
        format: 'artist'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=640&q=80",
        alt: "Artist silhouette",
        category: 'avatar',
        format: 'artist'
      }
    },
    background: {
      fictional: {
        url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=80",
        alt: "Art studio workspace",
        category: 'background',
        format: 'artist'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
        alt: "Creative background",
        category: 'background',
        format: 'artist'
      }
    }
  },
  creator: {
    avatar: {
      fictional: {
        url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=640&q=80",
        alt: "Content creator portrait",
        category: 'avatar',
        format: 'creator'
      },
      personalized: {
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=640&q=80",
        alt: "Digital creator headshot",
        category: 'avatar',
        format: 'creator'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=640&q=80",
        alt: "Creator silhouette",
        category: 'avatar',
        format: 'creator'
      }
    },
    background: {
      fictional: {
        url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=1200&q=80",
        alt: "Digital workspace",
        category: 'background',
        format: 'creator'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
        alt: "Tech background",
        category: 'background',
        format: 'creator'
      }
    }
  },
  custom: {
    avatar: {
      fictional: {
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=640&q=80",
        alt: "Professional portrait",
        category: 'avatar',
        format: 'custom'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=640&q=80",
        alt: "Professional silhouette",
        category: 'avatar',
        format: 'custom'
      }
    },
    background: {
      fictional: {
        url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
        alt: "Professional background",
        category: 'background',
        format: 'custom'
      },
      fallback: {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
        alt: "Neutral background",
        category: 'background',
        format: 'custom'
      }
    }
  }
};

// Image utility functions
export function getTemplateImage(
  format: string, 
  category: 'avatar' | 'background' | 'logo' | 'accent',
  userImage?: string,
  usePersonalized: boolean = false
): TemplateImage {
  const formatImages = TEMPLATE_IMAGES[format] || TEMPLATE_IMAGES.custom;
  const categoryImages = formatImages[category];
  
  if (!categoryImages) {
    return {
      url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=640&q=80",
      alt: "Placeholder image",
      category,
      format
    };
  }

  // If user has provided their own image, use it
  if (userImage) {
    return {
      url: userImage,
      alt: `User ${category}`,
      category,
      format
    };
  }

  // Use personalized version if available and requested
  if (usePersonalized && categoryImages.personalized) {
    return categoryImages.personalized;
  }

  // Default to fictional version
  return categoryImages.fictional;
}

export function getAvatarImage(format: string, userAvatar?: string): string {
  return getTemplateImage(format, 'avatar', userAvatar, false).url;
}

export function getBackgroundImage(format: string, userBackground?: string): string {
  return getTemplateImage(format, 'background', userBackground, false).url;
}

// Generate image with proper error handling
export function createImageElement(
  image: TemplateImage,
  className?: string,
  onError?: () => void
): React.ImgHTMLAttributes<HTMLImageElement> {
  return {
    src: image.url,
    alt: image.alt,
    className,
    onError: onError || (() => {
      console.warn(`Failed to load image: ${image.url}`);
    }),
    loading: 'lazy' as const,
    decoding: 'async' as const
  };
}