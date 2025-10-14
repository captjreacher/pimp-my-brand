import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

// Components to test
import CreateBrand from '@/pages/CreateBrand';
import BrandView from '@/pages/BrandView';
import CVView from '@/pages/CVView';
import { GenerateStep } from '@/components/wizard/GenerateStep';
import { CVEditor } from '@/components/editing/CVEditor';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      })
    },
    functions: {
      invoke: vi.fn()
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-brand-id' }
          })
        })
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-id', title: 'Test Brand' }
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'test-id' }
            })
          })
        })
      })
    })
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock file processing
vi.mock('@/lib/extract/file-processor', () => ({
  FileProcessor: {
    processFile: vi.fn().mockResolvedValue({
      text: 'Sample extracted text content for testing',
      metadata: { pages: 1, wordCount: 100 }
    })
  }
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe.skip('End-to-End Workflow Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Complete Brand Generation Workflow', () => {
    it('should complete the full brand generation workflow', async () => {
      // Mock successful API responses
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: {
            tone: { adjectives: ['professional', 'confident'] },
            signature_phrases: ['Let\'s make it happen', 'Excellence in action'],
            strengths: ['Leadership', 'Innovation'],
            weaknesses: ['May be too direct'],
            tagline: 'Professional Excellence',
            bio: 'A dedicated professional with expertise in leadership and innovation.'
          }
        })
        .mockResolvedValueOnce({
          data: {
            palette: [
              { name: 'Primary', hex: '#2563eb' },
              { name: 'Secondary', hex: '#7c3aed' }
            ],
            fonts: { heading: 'Poppins', body: 'Inter' },
            logo_prompt: 'Professional logo concept'
          }
        })
        .mockResolvedValueOnce({
          data: {
            markdown: '# Brand Rider\n\nTest brand content'
          }
        });

      const mockOnComplete = vi.fn();
      const mockOnBrandDataGenerated = vi.fn();

      render(
        <TestWrapper>
          <GenerateStep
            corpus="Test corpus content for analysis"
            uploadIds={['upload-1', 'upload-2']}
            format="professional"
            logoUrl={null}
            onComplete={mockOnComplete}
            onBrandDataGenerated={mockOnBrandDataGenerated}
          />
        </TestWrapper>
      );

      // Wait for the generation process to complete
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(3);
      }, { timeout: 10000 });

      // Verify style analysis call
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('generate-style', {
        body: { corpus: 'Test corpus content for analysis' }
      });

      // Verify visual analysis call
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('generate-visual', {
        body: {
          keywords: ['professional', 'confident'],
          roleTags: [],
          bio: 'A dedicated professional with expertise in leadership and innovation.'
        }
      });

      // Verify brand rider generation call
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('generate-brand-rider', {
        body: {
          styleData: expect.any(Object),
          visualData: expect.any(Object),
          format: 'professional'
        }
      });

      // Verify database save
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('brands');
      });

      // Verify completion callback
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith('test-brand-id');
      });

      // Verify success toast
      expect(toast.success).toHaveBeenCalledWith('Brand generated successfully!');
    });

    it('should handle CV generation after brand creation', async () => {
      // Mock brand generation success
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: {
            tone: { adjectives: ['professional'] },
            signature_phrases: ['Excellence'],
            strengths: ['Leadership'],
            weaknesses: [],
            tagline: 'Professional',
            bio: 'Professional bio'
          }
        })
        .mockResolvedValueOnce({
          data: {
            palette: [{ name: 'Primary', hex: '#2563eb' }],
            fonts: { heading: 'Poppins', body: 'Inter' }
          }
        })
        .mockResolvedValueOnce({
          data: { markdown: '# Brand Rider' }
        })
        .mockResolvedValueOnce({
          data: {
            name: 'John Professional',
            role: 'Senior Engineer',
            summary: 'Experienced professional',
            experience: [{
              role: 'Senior Engineer',
              org: 'Tech Corp',
              dates: '2020-Present',
              bullets: ['Led team of 5 developers']
            }],
            skills: ['JavaScript', 'Leadership'],
            links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/john' }],
            format: 'professional'
          }
        });

      // Mock brand save
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'test-brand-id', raw_context: { styleData: {}, visualData: {} } }
            })
          })
        })
      });

      // Mock profile fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { display_name: 'John Doe', role_tags: ['Engineer'] }
            })
          })
        })
      });

      // Mock CV save
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'test-cv-id' }
            })
          })
        })
      });

      const mockOnComplete = vi.fn();

      render(
        <TestWrapper>
          <GenerateStep
            corpus="Test corpus"
            uploadIds={['upload-1']}
            format="professional"
            onComplete={mockOnComplete}
          />
        </TestWrapper>
      );

      // Wait for brand generation to complete and CV option to appear
      await waitFor(() => {
        expect(screen.getByText('Brand Created Successfully!')).toBeInTheDocument();
      });

      // Click Generate CV button
      const generateCVButton = screen.getByText('Generate CV');
      fireEvent.click(generateCVButton);

      // Wait for CV generation to complete
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('generate-cv', {
          body: {
            styleData: expect.any(Object),
            extractedText: 'Test corpus',
            format: 'professional',
            userProfile: expect.any(Object)
          }
        });
      });

      // Verify CV was saved
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith('test-brand-id', 'test-cv-id');
      });
    });
  });

  describe('CV Editing Workflow', () => {
    const mockCV = {
      id: 'test-cv-id',
      name: 'John Doe',
      role: 'Software Engineer',
      summary: 'Experienced software engineer',
      experience: [{
        role: 'Senior Engineer',
        org: 'Tech Corp',
        dates: '2020-Present',
        bullets: ['Led development team', 'Improved system performance']
      }],
      skills: ['JavaScript', 'React', 'Node.js'],
      links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/johndoe' }],
      format: 'professional'
    };

    it('should allow editing CV personal information', async () => {
      const mockOnChange = vi.fn();
      const mockOnSave = vi.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <CVEditor
            cv={mockCV}
            onChange={mockOnChange}
            onSave={mockOnSave}
          />
        </TestWrapper>
      );

      // Edit name field
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'John Smith' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockCV,
        name: 'John Smith'
      });

      // Edit role field
      const roleInput = screen.getByDisplayValue('Software Engineer');
      fireEvent.change(roleInput, { target: { value: 'Senior Software Engineer' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockCV,
        role: 'Senior Software Engineer'
      });

      // Save CV
      const saveButton = screen.getByText('Save CV');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should allow adding and editing professional experience', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <CVEditor
            cv={mockCV}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      // Click Add Role button
      const addRoleButton = screen.getByText('Add Role');
      fireEvent.click(addRoleButton);

      // Fill in role dialog
      await waitFor(() => {
        expect(screen.getByText('Add New Role')).toBeInTheDocument();
      });

      const jobTitleInput = screen.getByPlaceholderText('e.g., Senior Software Engineer');
      const organizationInput = screen.getByPlaceholderText('e.g., Tech Company Inc.');
      const datesInput = screen.getByPlaceholderText('e.g., Jan 2020 - Present');
      const achievementInput = screen.getByPlaceholderText('Describe a key achievement or responsibility');

      fireEvent.change(jobTitleInput, { target: { value: 'Lead Developer' } });
      fireEvent.change(organizationInput, { target: { value: 'New Tech Corp' } });
      fireEvent.change(datesInput, { target: { value: '2022-Present' } });
      fireEvent.change(achievementInput, { target: { value: 'Led team of 10 developers' } });

      // Save role
      const saveRoleButton = screen.getByText('Add Role');
      fireEvent.click(saveRoleButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          ...mockCV,
          experience: [
            ...mockCV.experience,
            {
              role: 'Lead Developer',
              org: 'New Tech Corp',
              dates: '2022-Present',
              bullets: ['Led team of 10 developers']
            }
          ]
        });
      });
    });

    it('should allow managing skills', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <CVEditor
            cv={mockCV}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      // Add new skill
      const skillInput = screen.getByPlaceholderText('Add a skill');
      fireEvent.change(skillInput, { target: { value: 'TypeScript' } });

      const addSkillButton = screen.getByRole('button', { name: '' }); // Plus icon button
      fireEvent.click(addSkillButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockCV,
        skills: [...mockCV.skills, 'TypeScript']
      });

      // Remove existing skill
      const skillBadges = screen.getAllByText('×');
      fireEvent.click(skillBadges[0]); // Remove first skill

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockCV,
        skills: mockCV.skills.slice(1)
      });
    });

    it('should allow managing professional links', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <CVEditor
            cv={mockCV}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      // Click Add Link button
      const addLinkButton = screen.getByText('Add Link');
      fireEvent.click(addLinkButton);

      // Fill in link dialog
      await waitFor(() => {
        expect(screen.getByText('Add Professional Link')).toBeInTheDocument();
      });

      const labelInput = screen.getByPlaceholderText('e.g., LinkedIn, GitHub, Portfolio');
      const urlInput = screen.getByPlaceholderText('https://...');

      fireEvent.change(labelInput, { target: { value: 'GitHub' } });
      fireEvent.change(urlInput, { target: { value: 'https://github.com/johndoe' } });

      // Save link
      const saveLinkButton = screen.getByText('Add Link');
      fireEvent.click(saveLinkButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          ...mockCV,
          links: [
            ...mockCV.links,
            { label: 'GitHub', url: 'https://github.com/johndoe' }
          ]
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully during brand generation', async () => {
      // Mock API error
      mockSupabase.functions.invoke.mockRejectedValueOnce(
        new Error('API rate limit exceeded')
      );

      const mockOnComplete = vi.fn();

      render(
        <TestWrapper>
          <GenerateStep
            corpus="Test corpus"
            uploadIds={['upload-1']}
            format="professional"
            onComplete={mockOnComplete}
          />
        </TestWrapper>
      );

      // Wait for error handling
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('API rate limit exceeded');
      });

      // Verify completion was not called
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should handle CV generation errors', async () => {
      // Mock successful brand generation but failed CV generation
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({ data: { tone: {}, tagline: 'Test' } })
        .mockResolvedValueOnce({ data: { palette: [], fonts: {} } })
        .mockResolvedValueOnce({ data: { markdown: '# Test' } })
        .mockRejectedValueOnce(new Error('CV generation failed'));

      const mockOnComplete = vi.fn();

      render(
        <TestWrapper>
          <GenerateStep
            corpus="Test corpus"
            uploadIds={['upload-1']}
            format="professional"
            onComplete={mockOnComplete}
          />
        </TestWrapper>
      );

      // Wait for brand generation to complete
      await waitFor(() => {
        expect(screen.getByText('Generate CV')).toBeInTheDocument();
      });

      // Click Generate CV
      fireEvent.click(screen.getByText('Generate CV'));

      // Wait for error
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('CV generation failed');
      });
    });

    it('should validate required fields in CV editor', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <CVEditor
            cv={mockCV}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      // Try to add role without required fields
      fireEvent.click(screen.getByText('Add Role'));

      await waitFor(() => {
        expect(screen.getByText('Add New Role')).toBeInTheDocument();
      });

      // Try to save without filling required fields
      const saveRoleButton = screen.getByText('Add Role');
      fireEvent.click(saveRoleButton);

      // Should show validation error
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Role and organization are required');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should maintain data consistency across components', async () => {
      const testCV = { ...mockCV };
      const mockOnChange = vi.fn((updatedCV) => {
        Object.assign(testCV, updatedCV);
      });

      const { rerender } = render(
        <TestWrapper>
          <CVEditor
            cv={testCV}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      // Make changes
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

      // Rerender with updated CV
      rerender(
        <TestWrapper>
          <CVEditor
            cv={testCV}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      // Verify the change persisted
      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
    });

    it('should handle format changes correctly', async () => {
      const mockOnChange = vi.fn();

      render(
        <TestWrapper>
          <CVEditor
            cv={mockCV}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      // Change format
      const formatSelect = screen.getByDisplayValue('Custom');
      fireEvent.click(formatSelect);

      const ufcOption = screen.getByText('UFC');
      fireEvent.click(ufcOption);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...mockCV,
        format: 'ufc'
      });
    });
  });
});

// Helper function to create mock file
export const createMockFile = (name: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  return file;
};

// Helper function to simulate file upload
export const simulateFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Mock the file processing
  return {
    text: 'Extracted text from file',
    metadata: { pages: 1, wordCount: 100 }
  };
};