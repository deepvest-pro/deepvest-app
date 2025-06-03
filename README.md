# DeepVest Frontend

The modern investment platform for connecting founders and investors.

## Features

### 🚀 Project Creation from Presentations (NEW!)

Transform your PDF presentations into professional project profiles with AI-powered content extraction:

- **Drag & Drop Interface**: Simply drag your PDF presentation onto the homepage
- **AI Content Extraction**: Automatically extracts project name, description, and key details
- **Smart Project Generation**: Creates complete project structure with snapshots and documents
- **Progress Tracking**: Real-time progress indication through 9-step creation process
- **Error Handling**: Comprehensive error recovery with user-friendly messages
- **Authentication Integration**: Seamless sign-in prompts for unauthenticated users

**Supported Files**: PDF presentations up to 10MB

### Core Platform Features

- User authentication and profiles
- Project management with snapshots
- Document and file management
- Investment tracking and analytics
- Team collaboration tools

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Radix UI + Custom SCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Integration**: Google Gemini 2.0 Flash
- **File Storage**: Supabase Storage

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd deepvest-frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## API Endpoints

### Project Creation from Presentations

- `POST /api/ai/generate-content` - Universal AI content generation
- `POST /api/projects` - Create new projects
- `POST /api/projects/[id]/snapshots` - Create project snapshots
- `POST /api/projects/[id]/upload` - Upload files to projects
- `POST /api/projects/[id]/documents` - Create project documents
- `POST /api/transcribe` - Extract content from files

### Core APIs

- Authentication endpoints
- Project management APIs
- User profile management
- File upload and storage

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── home/           # Homepage components
│   ├── projects/       # Project-related components
│   ├── auth/           # Authentication components
│   └── ui/             # Reusable UI components
├── lib/                # Utility libraries
│   ├── supabase/       # Database helpers
│   ├── prompts.ts      # AI prompts
│   └── validations/    # Form validation schemas
├── types/              # TypeScript type definitions
└── styles/             # SCSS stylesheets
```

## Development

### Code Standards

- TypeScript with strict mode
- ESLint + Prettier for code formatting
- Component-based architecture
- Comprehensive error handling
- Type-safe API interactions

### Key Components

- `ProjectCreationDropzone` - Drag & drop file upload with AI processing
- `HomePageContent` - Main homepage with integrated dropzone
- Authentication components with Supabase integration
- Project management interface

## Deployment

The application is designed for deployment on Vercel with Supabase backend.

### Build

```bash
npm run build
```

### Environment Setup

Ensure all environment variables are configured in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[License information]
