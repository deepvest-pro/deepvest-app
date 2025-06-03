# Drag & Drop Project Creation from Presentations

## Overview

The DeepVest platform now supports automatic project creation from PDF presentations using AI-powered content extraction. This feature allows users to quickly transform their pitch decks and presentations into structured project profiles.

## How It Works

### User Experience Flow

1. **Access the Feature**: Visit the DeepVest homepage
2. **Authentication**: Sign in to your account (required for project creation)
3. **Upload Presentation**: Drag and drop your PDF file or click to browse
4. **Automatic Processing**: AI extracts and analyzes content
5. **Project Creation**: Complete project structure is generated
6. **Review & Edit**: Navigate to your new project to review and refine

### Processing Steps

The system performs the following steps automatically:

1. **File Validation** (5% progress)

   - Checks file type (PDF only)
   - Validates file size (max 10MB)

2. **Project Creation** (15% progress)

   - Creates temporary project with timestamp-based naming
   - Generates unique project slug

3. **Project Structure Setup** (25% progress)

   - Creates initial project snapshot
   - Sets up project permissions

4. **File Upload** (35% progress)

   - Uploads PDF to secure storage
   - Associates file with project

5. **Document Creation** (45% progress)

   - Creates document entry in project
   - Links uploaded file to document

6. **Content Extraction** (55% progress)

   - Uses AI to extract text from PDF
   - Converts content to structured format

7. **AI Analysis** (75% progress)

   - Analyzes extracted content
   - Generates project metadata

8. **Project Finalization** (90% progress)

   - Updates project with AI-generated data
   - Saves extracted content to document

9. **Completion** (100% progress)
   - Redirects to completed project
   - Shows success notification

## Supported Files

- **Format**: PDF only
- **Size Limit**: 10MB maximum
- **Content Types**: Presentations, pitch decks, business plans

## AI-Generated Project Data

The AI automatically extracts and generates:

- **Project Name**: Derived from presentation title/content
- **Description**: Comprehensive project summary (up to 1000 characters)
- **Slogan**: Catchy tagline if identifiable (optional)
- **Status**: Project stage (idea, concept, prototype, MVP, etc.)
- **Location**: Country and city if mentioned
- **Content**: Full text extraction in markdown format

## Error Handling

The system handles various error scenarios:

- **Invalid File Type**: Shows error for non-PDF files
- **File Too Large**: Warns about size limit exceeded
- **Upload Failures**: Provides retry options
- **AI Processing Errors**: Graceful fallback with manual editing options
- **Authentication Issues**: Redirects to sign-in page

## Technical Implementation

### API Endpoints Used

- `POST /api/projects` - Creates initial project
- `POST /api/projects/[id]/snapshots` - Creates project snapshot
- `POST /api/projects/[id]/upload` - Uploads presentation file
- `POST /api/projects/[id]/documents` - Creates document entry
- `POST /api/transcribe` - Extracts content from PDF
- `POST /api/ai/generate-content` - Generates project metadata

### Security Features

- **Authentication Required**: Only signed-in users can create projects
- **File Validation**: Server-side validation of file type and size
- **Secure Upload**: Files stored in protected Supabase storage
- **Rate Limiting**: AI requests are throttled to prevent abuse
- **Error Recovery**: Failed operations are cleaned up automatically

## Best Practices

### For Users

1. **Prepare Your PDF**: Ensure text is readable (not scanned images)
2. **Clear Content**: Use descriptive titles and structured content
3. **File Size**: Keep presentations under 10MB for best performance
4. **Review Results**: Always review and edit AI-generated content

### For Developers

1. **Error Handling**: Always provide user-friendly error messages
2. **Progress Feedback**: Show clear progress indication for long operations
3. **Cleanup**: Ensure failed operations don't leave orphaned data
4. **Validation**: Validate inputs on both client and server side

## Troubleshooting

### Common Issues

**"Only PDF files are supported"**

- Solution: Convert your presentation to PDF format

**"File size must be less than 10MB"**

- Solution: Compress your PDF or remove large images

**"Failed to transcribe file"**

- Solution: Ensure PDF contains readable text (not just images)

**"AI service not configured"**

- Solution: Contact administrator - Gemini API key may be missing

### Getting Help

If you encounter issues:

1. Try the "Try Again" button for temporary failures
2. Check your internet connection
3. Ensure you're signed in to your account
4. Contact support if problems persist

## Future Enhancements

Planned improvements include:

- Support for PowerPoint (.pptx) files
- Batch upload for multiple presentations
- Custom AI prompts for specific industries
- Integration with external presentation platforms
- Advanced content analysis and suggestions

## API Documentation

For developers integrating with this feature, see:

- [AI Content Generation API](../api/ai-generate-content.md)
- [Project Creation API](../api/projects.md)
- [File Upload API](../api/upload.md)
- [Transcription API](../api/transcribe.md)
