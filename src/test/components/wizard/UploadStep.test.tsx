import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UploadStep } from '@/components/wizard/UploadStep';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(() => Promise.resolve({
                data: { user: { id: 'test-user-id' } },
                error: null
            }))
        },
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn(() => Promise.resolve({
                    data: { id: 'test-id', path: 'test-path', fullPath: 'test-full-path' },
                    error: null
                })),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } }))
            }))
        },
        from: vi.fn(() => ({
            insert: vi.fn(() => Promise.resolve({ data: [{ id: 'test-upload-id' }], error: null }))
        }))
    }
}));

// Mock file processors
vi.mock('@/lib/extract/file-processor', () => ({
    fileProcessor: {
        requiresOCR: vi.fn(() => false),
        canProcess: vi.fn(() => true),
        getSupportedTypes: vi.fn(() => ['.txt', '.md', '.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg']),
        getFileTypeInfo: vi.fn(() => ({ type: 'text', processor: 'TextProcessor', supported: true }))
    },
    processFile: vi.fn(() => Promise.resolve('Extracted text content'))
}));

// Mock text extraction functions
vi.mock('@/lib/extract/text', () => ({
    extractText: vi.fn(() => Promise.resolve('Extracted text content')),
    combineCorpus: vi.fn((texts) => texts.join('\n\n')),
    requiresOCR: vi.fn(() => false)
}));

// Mock accessibility hooks
vi.mock('@/hooks/use-accessibility', () => ({
    useScreenReader: () => ({
        announce: vi.fn()
    }),
    useAccessibleLoading: () => ({})
}));

// Mock loading hooks
vi.mock('@/hooks/use-loading-state', () => ({
    useMultiStepLoading: () => ({
        steps: [
            { id: 'validate', label: 'Validating files', status: 'pending' },
            { id: 'extract', label: 'Extracting text content', status: 'pending' },
            { id: 'upload', label: 'Uploading to storage', status: 'pending' },
            { id: 'save', label: 'Saving to database', status: 'pending' }
        ],
        reset: vi.fn(),
        setStepStatus: vi.fn()
    })
}));

// Mock toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        promise: vi.fn((promise) => promise)
    }
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('UploadStep Component', () => {
    const mockOnComplete = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders upload interface', () => {
        render(
            <TestWrapper>
                <UploadStep onComplete={mockOnComplete} />
            </TestWrapper>
        );

        expect(screen.getByText('Upload Your Content')).toBeInTheDocument();
        expect(screen.getByText('Choose files')).toBeInTheDocument();
        expect(screen.getByText(/Supports: TXT, MD, PDF, DOCX, Images/)).toBeInTheDocument();
    });

    it('shows file input with correct attributes', () => {
        render(
            <TestWrapper>
                <UploadStep onComplete={mockOnComplete} />
            </TestWrapper>
        );

        const fileInput = screen.getByRole('textbox', { hidden: true }) ||
            document.querySelector('input[type="file"]');

        expect(fileInput).toHaveAttribute('accept', '.txt,.md,.pdf,.docx,.doc,.png,.jpg,.jpeg');
        expect(fileInput).toHaveAttribute('multiple');
    });

    it('handles file selection', async () => {
        render(
            <TestWrapper>
                <UploadStep onComplete={mockOnComplete} />
            </TestWrapper>
        );

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

        Object.defineProperty(fileInput, 'files', {
            value: [testFile],
            writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
            expect(screen.getByText('Selected Files (1)')).toBeInTheDocument();
        });

        expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    it('shows OCR toggle for image files', async () => {
        // Mock requiresOCR to return true for image files
        const { requiresOCR } = await import('@/lib/extract/text');
        vi.mocked(requiresOCR).mockReturnValue(true);

        render(
            <TestWrapper>
                <UploadStep onComplete={mockOnComplete} />
            </TestWrapper>
        );

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        const imageFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });

        Object.defineProperty(fileInput, 'files', {
            value: [imageFile],
            writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
            expect(screen.getByText('Enable OCR for images')).toBeInTheDocument();
        });
    });

    it('allows removing selected files', async () => {
        render(
            <TestWrapper>
                <UploadStep onComplete={mockOnComplete} />
            </TestWrapper>
        );

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

        Object.defineProperty(fileInput, 'files', {
            value: [testFile],
            writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
            expect(screen.getByText('test.txt')).toBeInTheDocument();
        });

        const removeButton = screen.getByRole('button', { name: /remove/i });
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
        });
    });

    it('processes and uploads files on continue', async () => {
        render(
            <TestWrapper>
                <UploadStep onComplete={mockOnComplete} />
            </TestWrapper>
        );

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

        Object.defineProperty(fileInput, 'files', {
            value: [testFile],
            writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
            expect(screen.getByText('Continue')).toBeInTheDocument();
        });

        const continueButton = screen.getByText('Continue');
        fireEvent.click(continueButton);

        await waitFor(() => {
            expect(mockOnComplete).toHaveBeenCalled();
        });
    });

    it('shows loading state during upload', async () => {
        // Mock slow upload
        const { supabase } = await import('@/integrations/supabase/client');
        vi.mocked(supabase.storage.from).mockReturnValueOnce({
            upload: vi.fn(() => new Promise(resolve => setTimeout(() => resolve({
                data: { id: 'test-id', path: 'test-path', fullPath: 'test-full-path' },
                error: null
            }), 100))) as any,
            getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } }))
        } as any);

        render(
            <TestWrapper>
                <UploadStep onComplete={mockOnComplete} />
            </TestWrapper>
        );

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

        Object.defineProperty(fileInput, 'files', {
            value: [testFile],
            writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
            expect(screen.getByText('Continue')).toBeInTheDocument();
        });

        const continueButton = screen.getByText('Continue');
        fireEvent.click(continueButton);

        expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('handles upload errors gracefully', async () => {
        // Mock upload error
        const { supabase } = await import('@/integrations/supabase/client');
        vi.mocked(supabase.storage.from).mockReturnValueOnce({
            upload: vi.fn(() => Promise.resolve({
                data: null,
                error: { message: 'Upload failed', name: 'StorageError', __isStorageError: true }
            })) as any,
            getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } }))
        } as any);

        render(
            <TestWrapper>
                <UploadStep onComplete={mockOnComplete} />
            </TestWrapper>
        );

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

        Object.defineProperty(fileInput, 'files', {
            value: [testFile],
            writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
            expect(screen.getByText('Continue')).toBeInTheDocument();
        });

        const continueButton = screen.getByText('Continue');
        fireEvent.click(continueButton);

        await waitFor(() => {
            expect(mockOnComplete).not.toHaveBeenCalled();
        });
    });

    it('validates file types', async () => {
        render(
            <TestWrapper>
                <UploadStep onComplete={mockOnComplete} />
            </TestWrapper>
        );

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        // Try to upload unsupported file type
        const unsupportedFile = new File(['test content'], 'test.xyz', { type: 'application/unknown' });

        Object.defineProperty(fileInput, 'files', {
            value: [unsupportedFile],
            writable: false,
        });

        fireEvent.change(fileInput);

        // Should not show the file in selected files
        expect(screen.queryByText('test.xyz')).not.toBeInTheDocument();
    });

    it('shows progress for multiple files', async () => {
        render(
            <TestWrapper>
                <UploadStep onComplete={mockOnComplete} />
            </TestWrapper>
        );

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        const files = [
            new File(['content 1'], 'test1.txt', { type: 'text/plain' }),
            new File(['content 2'], 'test2.txt', { type: 'text/plain' })
        ];

        Object.defineProperty(fileInput, 'files', {
            value: files,
            writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
            expect(screen.getByText('Selected Files (2)')).toBeInTheDocument();
        });

        expect(screen.getByText('test1.txt')).toBeInTheDocument();
        expect(screen.getByText('test2.txt')).toBeInTheDocument();
    });
});