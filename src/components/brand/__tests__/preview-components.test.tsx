import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { 
  BrandRiderPreview, 
  BrandRiderCard, 
  BrandRiderMobilePreview,
  BrandRiderPrintPreview,
  CVPreview, 
  CVCard, 
  CVPrintPreview,
  CVMobilePreview 
} from '../index';
import { BrandRider, CV } from '@/lib/generators/types';

// Mock data
const mockBrandRider: BrandRider = {
  id: '1',
  title: 'Test Brand',
  tagline: 'Test tagline for brand',
  voiceTone: ['Professional', 'Confident', 'Approachable'],
  signaturePhrases: ['Excellence in action', 'Leading by example'],
  strengths: ['Strategic thinking', 'Team leadership', 'Innovation'],
  weaknesses: ['Perfectionism', 'Impatience'],
  palette: [
    { name: 'Primary Blue', hex: '#0066CC' },
    { name: 'Secondary Gray', hex: '#666666' }
  ],
  fonts: {
    heading: 'Poppins',
    body: 'Inter'
  },
  bio: 'A professional with extensive experience in leadership and innovation.',
  examples: [
    { context: 'LinkedIn', example: 'Driving innovation through strategic leadership.' },
    { context: 'Email', example: 'Best regards, leading by example.' }
  ],
  format: 'professional',
  createdAt: '2024-01-01',
  isPublic: true
};

const mockCV: CV = {
  id: '1',
  name: 'John Doe',
  role: 'Senior Software Engineer',
  summary: 'Experienced software engineer with a passion for building scalable applications.',
  experience: [
    {
      role: 'Senior Software Engineer',
      org: 'Tech Corp',
      dates: '2020-Present',
      bullets: [
        'Led development of microservices architecture',
        'Mentored junior developers',
        'Improved system performance by 40%'
      ]
    },
    {
      role: 'Software Engineer',
      org: 'StartupCo',
      dates: '2018-2020',
      bullets: [
        'Built full-stack web applications',
        'Implemented CI/CD pipelines',
        'Collaborated with cross-functional teams'
      ]
    }
  ],
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'Docker'],
  links: [
    { label: 'LinkedIn', url: 'https://linkedin.com/in/johndoe' },
    { label: 'GitHub', url: 'https://github.com/johndoe' }
  ],
  format: 'professional',
  createdAt: '2024-01-01',
  isPublic: true
};

describe('BrandRider Preview Components', () => {
  it('renders BrandRiderPreview with all sections', () => {
    render(<BrandRiderPreview brandRider={mockBrandRider} />);
    
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByText('Test tagline for brand')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Excellence in action')).toBeInTheDocument();
    expect(screen.getByText('Strategic thinking')).toBeInTheDocument();
  });

  it('renders BrandRiderCard in compact format', () => {
    render(<BrandRiderCard brandRider={mockBrandRider} />);
    
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByText('Test tagline for brand')).toBeInTheDocument();
  });

  it('renders BrandRiderMobilePreview for mobile screens', () => {
    render(<BrandRiderMobilePreview brandRider={mockBrandRider} />);
    
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByText('Voice & Tone')).toBeInTheDocument();
    expect(screen.getByText('Strengths (3)')).toBeInTheDocument();
  });

  it('renders BrandRiderPrintPreview for printing', () => {
    render(<BrandRiderPrintPreview brandRider={mockBrandRider} />);
    
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByText('TAGLINE')).toBeInTheDocument();
    expect(screen.getByText('COLOR PALETTE')).toBeInTheDocument();
  });
});

describe('CV Preview Components', () => {
  it('renders CVPreview with all sections', () => {
    render(<CVPreview cv={mockCV} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Experienced software engineer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('renders CVCard in compact format', () => {
    render(<CVCard cv={mockCV} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('2 roles')).toBeInTheDocument();
    expect(screen.getByText('6 skills')).toBeInTheDocument();
  });

  it('renders CVMobilePreview for mobile screens', () => {
    render(<CVMobilePreview cv={mockCV} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Experience (2)')).toBeInTheDocument();
    expect(screen.getByText('Skills (6)')).toBeInTheDocument();
  });

  it('renders CVPrintPreview for printing', () => {
    render(<CVPrintPreview cv={mockCV} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('PROFESSIONAL SUMMARY')).toBeInTheDocument();
    expect(screen.getByText('PROFESSIONAL EXPERIENCE')).toBeInTheDocument();
    expect(screen.getByText('CORE COMPETENCIES')).toBeInTheDocument();
  });

  it('handles responsive design classes correctly', () => {
    const { container } = render(<CVPreview cv={mockCV} />);
    
    // Check for responsive classes
    expect(container.querySelector('.sm\\:space-y-6')).toBeInTheDocument();
    expect(container.querySelector('.lg\\:grid-cols-3')).toBeInTheDocument();
  });
});

describe('Responsive Design', () => {
  it('applies mobile-first responsive classes in BrandRiderPreview', () => {
    const { container } = render(<BrandRiderPreview brandRider={mockBrandRider} />);
    
    // Check for mobile-first responsive classes
    expect(container.querySelector('.text-2xl')).toBeInTheDocument();
    expect(container.querySelector('.sm\\:text-3xl')).toBeInTheDocument();
    expect(container.querySelector('.md\\:grid-cols-2')).toBeInTheDocument();
  });

  it('applies mobile-first responsive classes in CVPreview', () => {
    const { container } = render(<CVPreview cv={mockCV} />);
    
    // Check for mobile-first responsive classes
    expect(container.querySelector('.text-2xl')).toBeInTheDocument();
    expect(container.querySelector('.sm\\:text-3xl')).toBeInTheDocument();
    expect(container.querySelector('.lg\\:col-span-2')).toBeInTheDocument();
  });

  it('handles compact mode correctly', () => {
    render(<BrandRiderPreview brandRider={mockBrandRider} compact={true} />);
    render(<CVPreview cv={mockCV} compact={true} />);
    
    // Components should render without errors in compact mode
    expect(screen.getAllByText('Test Brand')).toHaveLength(1);
    expect(screen.getAllByText('John Doe')).toHaveLength(1);
  });
});