# FunkMyBrand

AI-powered personal branding platform that generates professional brand identities and CVs with multiple presentation formats.

## 🚀 Features

- **AI Brand Analysis** - Upload documents to extract your unique brand voice
- **Visual Identity Generation** - AI-created color palettes and font recommendations
- **Multiple CV Formats** - UFC, Military, Executive, Influencer, and more presentation styles
- **Brand Rider Creation** - Professional brand guidelines and usage examples
- **Export & Sharing** - PDF/PNG export with secure sharing links
- **Admin Dashboard** - Comprehensive user and content management

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (Database + Auth + Storage + Edge Functions)
- **AI**: OpenAI GPT-4o-mini for content generation
- **Styling**: Tailwind CSS + Radix UI components
- **Deployment**: Spaceship hosting + Custom domain

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key
- Supabase project

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/funkmybrand.git
cd funkmybrand

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Integration
OPENAI_API_KEY=your-openai-api-key

# Application
VITE_APP_URL=https://funkmybrand.com
```

## 🚀 Deployment

### Deploy to Spaceship Hosting

```bash
# Run deployment script
npm run deploy:spaceship

# Upload the generated zip file to your hosting
# Follow the generated instructions
```

### Deploy Supabase Functions

```bash
# Deploy AI functions
supabase functions deploy generate-style
supabase functions deploy generate-visual
supabase functions deploy generate-brand-rider
supabase functions deploy generate-cv

# Set environment variables
supabase secrets set OPENAI_API_KEY=your-key
```

## 📚 Documentation

- The most up-to-date deployment, production, and platform setup guides live in the project root alongside this README.
- Legacy admin references, troubleshooting notes, and historical research have been moved to [`docs/archive`](docs/archive) to keep the workspace tidy while preserving institutional knowledge.

## 📁 Project Structure

```
funkmybrand/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities and services
│   └── integrations/       # Supabase integration
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Database migrations
├── scripts/                # Deployment and utility scripts
└── docs/
    └── archive/           # Historical docs grouped by topic
```

## 🎨 Brand Formats

FunkMyBrand supports multiple presentation formats:

- **UFC** - High-energy ring announcer style
- **Military** - Precise, mission-focused language
- **Executive** - C-suite corporate leadership tone
- **Influencer** - Social media and creator economy style
- **Artist** - Creative portfolio and press kit format
- **Humanitarian** - Mission-driven impact focus
- **And more...**

## 🔧 Development

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run test             # Run tests
npm run lint             # Lint code
npm run deploy:spaceship # Deploy to hosting
```

### Testing

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:e2e
```

## 📊 Cost Estimates

### Monthly Operating Costs
- **Supabase Pro**: $25/month
- **OpenAI API**: $3-15/month (usage-based)
- **Spaceship Hosting**: Varies by plan
- **Total**: ~$30-50/month

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Open a GitHub issue
- **Email**: support@funkmybrand.com

## 🎯 Roadmap

- [ ] Additional AI models support
- [ ] More brand format templates
- [ ] Team collaboration features
- [ ] API for third-party integrations
- [ ] Mobile app

---

**FunkMyBrand** - Funk up your professional presence! 🎸