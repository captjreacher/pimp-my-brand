# Personal Brand Generator - Requirements Document

## Introduction

The Personal Brand Generator is a web application that transforms user-provided text content into professional brand assets. Users upload documents (PDFs, text files, etc.), and the system uses AI to analyze their writing style, generate brand guidelines, and create formatted Brand Rider and CV documents. The application supports multiple presentation formats (UFC, Military, Sports, etc.) and includes sharing, editing, and community gallery features.

## Requirements

### Requirement 1: File Upload and Text Extraction

**User Story:** As a user, I want to upload various document types so that the system can analyze my writing style and content.

#### Acceptance Criteria

1. WHEN a user uploads a PDF file THEN the system SHALL extract text content using appropriate parsing libraries
2. WHEN a user uploads a TXT or MD file THEN the system SHALL read the raw text content
3. WHEN a user uploads a DOCX file THEN the system SHALL extract text content while preserving structure
4. WHEN a user uploads an image file (PNG/JPG) THEN the system SHALL provide OCR capability as an optional feature
5. WHEN file upload is complete THEN the system SHALL store the file in Supabase storage and save metadata to the uploads table
6. WHEN text extraction is complete THEN the system SHALL save the extracted text to the uploads.extracted_text field

### Requirement 2: AI-Powered Brand Analysis

**User Story:** As a user, I want the system to analyze my uploaded content so that it can understand my brand voice and visual preferences.

#### Acceptance Criteria

1. WHEN the system analyzes uploaded text THEN it SHALL generate a style synthesis including tone, signature phrases, strengths, and weaknesses
2. WHEN the system performs visual analysis THEN it SHALL generate color palettes, font recommendations, and logo concepts
3. WHEN AI analysis is complete THEN the system SHALL return structured JSON data for both style and visual elements
4. WHEN generating visual elements THEN the system SHALL ensure color palettes meet WCAG AA accessibility standards
5. WHEN creating font recommendations THEN the system SHALL only suggest Google Fonts for web compatibility

### Requirement 3: Presentation Format Selection

**User Story:** As a user, I want to choose from different presentation formats so that my brand materials match my professional context.

#### Acceptance Criteria

1. WHEN a user selects UFC format THEN the system SHALL apply high-energy ring-announcer style language
2. WHEN a user selects Military format THEN the system SHALL apply precise, professional military terminology
3. WHEN a user selects Team Captain format THEN the system SHALL apply TV roster and sports team language
4. WHEN a user selects Solo Athlete format THEN the system SHALL apply individual sports commentary style
5. WHEN a user selects NFL format THEN the system SHALL apply American football broadcast terminology
6. WHEN a user selects Influencer format THEN the system SHALL apply social media and celebrity language
7. WHEN a user selects Custom format THEN the system SHALL allow them to specify custom tone keywords

### Requirement 4: Brand Rider Generation

**User Story:** As a user, I want to generate a professional 1-page Brand Rider so that I can communicate my brand guidelines effectively.

#### Acceptance Criteria

1. WHEN generating a Brand Rider THEN the system SHALL create a document with tagline, voice & tone, signature phrases, color palette, fonts, bio, and usage examples
2. WHEN displaying the Brand Rider THEN the system SHALL format it as a single page with proper visual hierarchy
3. WHEN applying presentation format THEN the system SHALL modify language tone while preserving factual content
4. WHEN showing color swatches THEN the system SHALL display hex values and color names
5. WHEN presenting fonts THEN the system SHALL show both heading and body font selections

### Requirement 5: CV Generation

**User Story:** As a user, I want to generate a professional 1-page CV so that I can present my experience in a compelling format.

#### Acceptance Criteria

1. WHEN generating a CV THEN the system SHALL create a document with name, role, summary, experience, skills, and links
2. WHEN formatting experience THEN the system SHALL limit to 3 roles maximum with 3 achievement bullets each
3. WHEN applying presentation format THEN the system SHALL adapt language style while maintaining professional accuracy
4. WHEN displaying skills THEN the system SHALL present them as a readable comma-separated list
5. WHEN showing links THEN the system SHALL format them as label-URL pairs

### Requirement 6: Interactive Editing

**User Story:** As a user, I want to edit generated content and customize visual elements so that I can perfect my brand materials.

#### Acceptance Criteria

1. WHEN viewing generated content THEN the system SHALL provide inline editing capabilities
2. WHEN editing text THEN the system SHALL support markdown formatting and live preview
3. WHEN changing colors THEN the system SHALL provide a palette picker with real-time preview
4. WHEN switching fonts THEN the system SHALL show Google Fonts options with live preview
5. WHEN making changes THEN the system SHALL auto-save edits to the database

### Requirement 7: PDF Export and Sharing

**User Story:** As a user, I want to export my brand materials and share them so that I can use them professionally and get feedback.

#### Acceptance Criteria

1. WHEN exporting to PDF THEN the system SHALL generate print-ready A4 documents using HTML-to-PDF conversion
2. WHEN creating share links THEN the system SHALL generate unique tokens for read-only access
3. WHEN accessing shared content THEN users SHALL be able to view without authentication
4. WHEN exporting PNG THEN the system SHALL create high-quality images of the hero sections
5. WHEN sharing THEN the system SHALL respect privacy settings (private/public visibility)

### Requirement 8: Community Gallery

**User Story:** As a user, I want to browse and share brand materials in a community gallery so that I can get inspiration and showcase my work.

#### Acceptance Criteria

1. WHEN setting visibility to public THEN brand materials SHALL appear in the community gallery
2. WHEN browsing the gallery THEN users SHALL see only public items with search and filtering
3. WHEN viewing gallery items THEN users SHALL see preview cards with key brand elements
4. WHEN searching the gallery THEN users SHALL be able to filter by role tags and format types
5. WHEN accessing gallery items THEN users SHALL be able to view full brand materials in read-only mode

### Requirement 9: User Authentication and Profiles

**User Story:** As a user, I want to create an account and manage my profile so that I can save my work and control my brand presence.

#### Acceptance Criteria

1. WHEN signing up THEN users SHALL be able to create accounts with email/password or OAuth (Google, GitHub)
2. WHEN creating a profile THEN users SHALL be able to set display name, handle, avatar, bio, and role tags
3. WHEN managing visibility THEN users SHALL be able to set profile visibility to private or public
4. WHEN updating profile THEN users SHALL be able to add social links and website URL
5. WHEN accessing the system THEN authentication SHALL be handled by Supabase Auth with RLS policies

### Requirement 10: Data Management and Storage

**User Story:** As a system administrator, I want proper data management and security so that user data is protected and the system is scalable.

#### Acceptance Criteria

1. WHEN storing user data THEN the system SHALL implement Row Level Security (RLS) policies
2. WHEN managing files THEN the system SHALL use Supabase Storage with proper access controls
3. WHEN handling uploads THEN the system SHALL store files in organized buckets (uploads, logos, exports)
4. WHEN processing data THEN the system SHALL validate all inputs using Zod schemas
5. WHEN accessing data THEN users SHALL only see their own private content and public content from others