// Comprehensive file validation and security checks
import { 
  ValidationResult, 
  FILE_SIZE_LIMITS, 
  ALLOWED_FILE_TYPES,
  FileValidationOptions,
} from '@/lib/validation/utils';
import { 
  FileProcessingError, 
  ErrorCode,
  createFileProcessingError,
} from '@/lib/errors';

// File signature mappings for MIME type validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  // PDF files
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  
  // DOCX files (ZIP-based)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4B, 0x03, 0x04], // PK.. (ZIP header)
    [0x50, 0x4B, 0x05, 0x06], // PK.. (ZIP empty archive)
    [0x50, 0x4B, 0x07, 0x08], // PK.. (ZIP spanned archive)
  ],
  
  // DOC files
  'application/msword': [
    [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // OLE2 header
  ],
  
  // Text files (no specific signature, but we can check for valid UTF-8)
  'text/plain': [],
  'text/markdown': [],
  
  // Image files
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container)
  ],
};

// Dangerous file extensions and MIME types
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.pkg', '.dmg', '.iso', '.msi', '.run', '.sh', '.ps1',
];

const DANGEROUS_MIME_TYPES = [
  'application/x-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-sh',
  'application/x-shellscript',
  'text/x-shellscript',
  'application/javascript',
  'text/javascript',
];

// Maximum file sizes by type
const TYPE_SIZE_LIMITS: Record<string, number> = {
  'application/pdf': 25 * 1024 * 1024, // 25MB for PDFs
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10 * 1024 * 1024, // 10MB for DOCX
  'application/msword': 10 * 1024 * 1024, // 10MB for DOC
  'text/plain': 5 * 1024 * 1024, // 5MB for text files
  'text/markdown': 5 * 1024 * 1024, // 5MB for markdown
  'image/jpeg': 10 * 1024 * 1024, // 10MB for JPEG
  'image/png': 10 * 1024 * 1024, // 10MB for PNG
  'image/gif': 5 * 1024 * 1024, // 5MB for GIF
  'image/webp': 10 * 1024 * 1024, // 10MB for WebP
};

export interface SecurityValidationOptions extends FileValidationOptions {
  checkFileSignature?: boolean;
  scanForMalware?: boolean;
  allowExecutables?: boolean;
  customSignatureCheck?: (file: File, buffer: ArrayBuffer) => Promise<boolean>;
}

export interface FileSecurityResult extends ValidationResult<File> {
  securityWarnings?: string[];
  quarantined?: boolean;
}

// Read file header for signature validation
async function readFileHeader(file: File, bytes = 16): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const slice = file.slice(0, bytes);
    
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error('Failed to read file header'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(slice);
  });
}

// Validate file signature against MIME type
async function validateFileSignature(file: File): Promise<boolean> {
  try {
    const header = await readFileHeader(file, 16);
    const signatures = FILE_SIGNATURES[file.type];
    
    if (!signatures || signatures.length === 0) {
      // For text files, check if content is valid UTF-8
      if (file.type.startsWith('text/')) {
        return await validateTextFile(file);
      }
      return true; // No signature check needed
    }
    
    // Check if file header matches any of the expected signatures
    return signatures.some(signature => {
      if (header.length < signature.length) return false;
      
      return signature.every((byte, index) => header[index] === byte);
    });
  } catch (error) {
    console.error('File signature validation failed:', error);
    return false;
  }
}

// Validate text file content
async function validateTextFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        // Check if the content is valid UTF-8 by trying to decode it
        const content = reader.result as string;
        
        // Basic checks for text content
        if (content.length === 0) {
          resolve(false);
          return;
        }
        
        // Check for suspicious patterns that might indicate malicious content
        const suspiciousPatterns = [
          /<script/i,
          /javascript:/i,
          /vbscript:/i,
          /onload=/i,
          /onerror=/i,
          /eval\(/i,
          /document\.write/i,
        ];
        
        const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
          pattern.test(content)
        );
        
        resolve(!hasSuspiciousContent);
      } catch (error) {
        resolve(false);
      }
    };
    
    reader.onerror = () => resolve(false);
    reader.readAsText(file.slice(0, 1024)); // Read first 1KB for validation
  });
}

// Check for dangerous file characteristics
function checkDangerousFile(file: File): string[] {
  const warnings: string[] = [];
  
  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    warnings.push(`Potentially dangerous file extension: ${extension}`);
  }
  
  // Check MIME type
  if (DANGEROUS_MIME_TYPES.includes(file.type)) {
    warnings.push(`Potentially dangerous MIME type: ${file.type}`);
  }
  
  // Check for suspicious file names
  const suspiciousNames = [
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, // Windows reserved names
    /\.(exe|bat|cmd|scr|pif)$/i, // Executable extensions
    /[<>:"|?*]/g, // Invalid filename characters
  ];
  
  suspiciousNames.forEach(pattern => {
    if (pattern.test(file.name)) {
      warnings.push(`Suspicious filename pattern: ${file.name}`);
    }
  });
  
  return warnings;
}

// Basic malware scanning (simplified heuristics)
async function basicMalwareScan(file: File): Promise<string[]> {
  const warnings: string[] = [];
  
  try {
    // Read a portion of the file for analysis
    const sampleSize = Math.min(file.size, 64 * 1024); // 64KB sample
    const header = await readFileHeader(file, sampleSize);
    
    // Convert to string for pattern matching
    const content = new TextDecoder('utf-8', { fatal: false }).decode(header);
    
    // Check for suspicious patterns
    const malwarePatterns = [
      /eval\s*\(/gi,
      /document\.write/gi,
      /fromCharCode/gi,
      /unescape/gi,
      /ActiveXObject/gi,
      /WScript\.Shell/gi,
      /cmd\.exe/gi,
      /powershell/gi,
      /base64/gi,
    ];
    
    malwarePatterns.forEach(pattern => {
      if (pattern.test(content)) {
        warnings.push(`Suspicious pattern detected: ${pattern.source}`);
      }
    });
    
    // Check for excessive obfuscation
    const obfuscationScore = calculateObfuscationScore(content);
    if (obfuscationScore > 0.7) {
      warnings.push('High obfuscation detected - possible malware');
    }
    
  } catch (error) {
    warnings.push('Unable to scan file content');
  }
  
  return warnings;
}

// Calculate obfuscation score (0-1, higher = more obfuscated)
function calculateObfuscationScore(content: string): number {
  if (content.length === 0) return 0;
  
  let score = 0;
  
  // Check for high entropy (random-looking strings)
  const entropy = calculateEntropy(content);
  if (entropy > 4.5) score += 0.3;
  
  // Check for excessive special characters
  const specialCharRatio = (content.match(/[^a-zA-Z0-9\s]/g) || []).length / content.length;
  if (specialCharRatio > 0.3) score += 0.2;
  
  // Check for very long lines (common in obfuscated code)
  const lines = content.split('\n');
  const longLines = lines.filter(line => line.length > 200).length;
  if (longLines / lines.length > 0.1) score += 0.2;
  
  // Check for excessive escape sequences
  const escapeRatio = (content.match(/\\[x\\]/g) || []).length / content.length;
  if (escapeRatio > 0.05) score += 0.3;
  
  return Math.min(score, 1);
}

// Calculate Shannon entropy
function calculateEntropy(str: string): number {
  const freq: Record<string, number> = {};
  
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  let entropy = 0;
  const len = str.length;
  
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

// Main file security validation function
export async function validateFileSecurely(
  file: File,
  options: SecurityValidationOptions = {}
): Promise<FileSecurityResult> {
  const {
    maxSize = FILE_SIZE_LIMITS.MAX_FILE_SIZE,
    allowedTypes = ALLOWED_FILE_TYPES.ALL,
    checkFileSignature = true,
    scanForMalware = true,
    allowExecutables = false,
    customSignatureCheck,
  } = options;
  
  const warnings: string[] = [];
  let quarantined = false;
  
  try {
    // Basic validation first
    if (file.size === 0) {
      throw createFileProcessingError(
        ErrorCode.FILE_PROCESSING_FAILED,
        'File is empty',
        file.name
      );
    }
    
    if (file.size > maxSize) {
      throw createFileProcessingError(
        ErrorCode.FILE_TOO_LARGE,
        `File size ${Math.round(file.size / 1024 / 1024)}MB exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`,
        file.name
      );
    }
    
    // Check type-specific size limits
    const typeLimit = TYPE_SIZE_LIMITS[file.type];
    if (typeLimit && file.size > typeLimit) {
      throw createFileProcessingError(
        ErrorCode.FILE_TOO_LARGE,
        `File size exceeds limit for ${file.type}: ${Math.round(typeLimit / 1024 / 1024)}MB`,
        file.name
      );
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw createFileProcessingError(
        ErrorCode.UNSUPPORTED_FILE_TYPE,
        `File type ${file.type} is not allowed`,
        file.name
      );
    }
    
    // Check for dangerous files
    if (!allowExecutables) {
      const dangerWarnings = checkDangerousFile(file);
      warnings.push(...dangerWarnings);
      
      if (dangerWarnings.length > 0) {
        quarantined = true;
        throw createFileProcessingError(
          ErrorCode.FILE_PROCESSING_FAILED,
          'File appears to be potentially dangerous',
          file.name
        );
      }
    }
    
    // File signature validation
    if (checkFileSignature) {
      let signatureValid = false;
      
      if (customSignatureCheck) {
        const buffer = await file.arrayBuffer();
        signatureValid = await customSignatureCheck(file, buffer);
      } else {
        signatureValid = await validateFileSignature(file);
      }
      
      if (!signatureValid) {
        warnings.push('File signature does not match declared MIME type');
        throw createFileProcessingError(
          ErrorCode.FILE_PROCESSING_FAILED,
          'File signature validation failed - file may be corrupted or misidentified',
          file.name
        );
      }
    }
    
    // Basic malware scanning
    if (scanForMalware) {
      const malwareWarnings = await basicMalwareScan(file);
      warnings.push(...malwareWarnings);
      
      if (malwareWarnings.length > 2) { // Threshold for quarantine
        quarantined = true;
        throw createFileProcessingError(
          ErrorCode.FILE_PROCESSING_FAILED,
          'File failed security scan - multiple suspicious patterns detected',
          file.name
        );
      }
    }
    
    return {
      success: true,
      data: file,
      securityWarnings: warnings,
      quarantined,
    };
    
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'file',
        message: error instanceof Error ? error.message : 'File validation failed',
        code: error instanceof FileProcessingError ? error.code : ErrorCode.FILE_PROCESSING_FAILED,
      }],
      securityWarnings: warnings,
      quarantined,
    };
  }
}

// Batch file security validation
export async function validateFilesSecurely(
  files: File[],
  options: SecurityValidationOptions = {}
): Promise<{
  validFiles: File[];
  invalidFiles: Array<{ file: File; error: string; warnings: string[] }>;
  totalWarnings: string[];
}> {
  const validFiles: File[] = [];
  const invalidFiles: Array<{ file: File; error: string; warnings: string[] }> = [];
  const totalWarnings: string[] = [];
  
  for (const file of files) {
    const result = await validateFileSecurely(file, options);
    
    if (result.success && result.data) {
      validFiles.push(result.data);
      if (result.securityWarnings) {
        totalWarnings.push(...result.securityWarnings);
      }
    } else {
      invalidFiles.push({
        file,
        error: result.errors?.[0]?.message || 'Validation failed',
        warnings: result.securityWarnings || [],
      });
    }
  }
  
  return {
    validFiles,
    invalidFiles,
    totalWarnings,
  };
}

// File quarantine utilities
export class FileQuarantine {
  private quarantinedFiles = new Map<string, { file: File; reason: string; timestamp: Date }>();
  
  quarantine(file: File, reason: string): string {
    const id = `quarantine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.quarantinedFiles.set(id, {
      file,
      reason,
      timestamp: new Date(),
    });
    return id;
  }
  
  release(id: string): File | null {
    const quarantined = this.quarantinedFiles.get(id);
    if (quarantined) {
      this.quarantinedFiles.delete(id);
      return quarantined.file;
    }
    return null;
  }
  
  list(): Array<{ id: string; fileName: string; reason: string; timestamp: Date }> {
    return Array.from(this.quarantinedFiles.entries()).map(([id, data]) => ({
      id,
      fileName: data.file.name,
      reason: data.reason,
      timestamp: data.timestamp,
    }));
  }
  
  clear(): void {
    this.quarantinedFiles.clear();
  }
}

// Global quarantine instance
export const globalQuarantine = new FileQuarantine();