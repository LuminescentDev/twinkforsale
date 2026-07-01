# 🌸 twink.forsale

> **⚠️ DISCLAIMER**: This project is mostly AI-generated and represents an exploration of how much functionality can be achieved through AI assistance. It serves as an experiment in AI-driven development rather than a production-ready application.

A cute and modern file hosting service built with Qwik, featuring ShareX integration, Discord authentication, and a kawaii aesthetic. Perfect for sharing screenshots, images, and files with style! (◕‿◕)♡

## ✨ Features

### 🎨 Core Functionality
- **File Upload & Sharing**: Upload images, documents, and other files with automatic short URL generation
- **ShareX Integration**: One-click configuration for seamless ShareX uploads
- **Discord Authentication**: Secure OAuth login through Discord
- **Custom Domains**: Support for custom upload domains and subdomains
- **User Management**: Admin approval system with role-based access control

### 📊 Analytics & Tracking
- **Detailed Analytics**: Track views, downloads, and user statistics
- **Real-time Charts**: Beautiful visualizations of upload and view data
- **File Management**: Organize and manage your uploads with advanced filtering
- **Storage Monitoring**: Track storage usage with configurable limits

### 🎀 User Experience
- **Multiple Themes**: Choose from various cute themes (kawaii, cyberpunk, etc.)
- **Responsive Design**: Beautiful UI that works on all devices
- **Embed Customization**: Customize Discord embed appearance for your uploads
- **File Expiration**: Set expiration dates and view limits for uploads

### 🔧 Advanced Features
- **API Keys**: Generate API keys for programmatic access
- **Batch Operations**: Select and manage multiple files at once
- **File Cleanup**: Automatic cleanup of expired files
- **Download Tracking**: Monitor file download statistics
- **Private Access**: Application-only access with admin approval required

## 🚀 Tech Stack

- **Framework**: [Qwik](https://qwik.dev/) - Modern web framework
- **Backend**: Node.js with Qwik City
- **Database**: SQLite with Prisma ORM
- **Authentication**: Auth.js with Discord provider
- **Styling**: Tailwind CSS with custom themes
- **Deployment**: Node.js server adapter
- **File Storage**: Local filesystem with configurable upload directory

## 📁 Project Structure

```
twinkforsale/
├── src/
│   ├── components/          # Reusable UI components
│   ├── lib/                # Utility functions and stores
│   ├── routes/             # Application routes and pages
│   └── global.css          # Global styles and theme variables
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── uploads/               # User uploaded files (gitignored)
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 24+
- Bun (recommended) or npm/yarn
- Discord application for OAuth

### 1. Clone & Install
```bash
git clone <repository-url>
cd twinkforsale
bun install
```

### 2. Environment Configuration
Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
AUTH_SECRET="your-secret-key-here"
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Application
BASE_URL="http://localhost:3000"
NODE_ENV="development"

# File Upload Settings
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"  # 10MB in bytes
BASE_STORAGE_LIMIT="10737418240"  # 10GB in bytes
ALLOWED_MIME_TYPES="image/png,image/jpeg,image/gif,image/webp,text/plain,application/pdf"
```

### 3. Database Setup
```bash
bun run prisma:generate
bun run prisma:migrate
```

### 4. Development
```bash
bun run dev
```

The application will be available at `http://localhost:3000`

### 5. Production Build
```bash
bun run build
bun run build.server
bun run deploy
```

## 🎮 Usage

### For Users
1. **Sign Up**: Use Discord OAuth to create an account
2. **Wait for Approval**: Admin approval required for new accounts
3. **Generate API Key**: Create API keys for ShareX integration
4. **Configure ShareX**: Download automatic configuration files
5. **Start Uploading**: Share files with cute short URLs!

### For Admins
- Access admin panel at `/admin`
- Approve/reject user registrations
- Manage upload domains
- Monitor system analytics
- Perform file cleanup operations

## 🔧 Configuration

### Upload Domains
Configure custom domains in the admin panel to use your own domain for file URLs instead of the default domain.

### Themes
Multiple themes available:
- **Kawaii**: Pink and cute aesthetic
- **Cyberpunk**: Dark tech vibes
- **Pastel**: Soft pastel colors
- **Dark**: Classic dark theme
- **Light**: Clean light theme

### Storage Limits
Configure per-user storage limits and file size restrictions through environment variables and admin settings.

## 📊 API Endpoints

### Upload API
**Authentication Required**: All uploads require a valid API key.

```http
POST /api/upload
Authorization: Bearer <api-key>
Content-Type: multipart/form-data

file: <file-data>
```

**Response**: Returns the twink.forsale URL for proper embed support:
```json
{
  "url": "https://twink.forsale/f/abc123",
  "deletion_url": "https://twink.forsale/delete/xyz789",
  "thumbnail_url": "https://twink.forsale/f/abc123"
}
```

### File Access
```http
GET /f/<shortCode>              # View file with embed
GET /f/<shortCode>?direct=true  # Direct file access
GET /f/<shortCode>?preview=true # Preview mode
```

## 🎨 AI Development Notes

This project demonstrates extensive use of AI assistance in:
- **Feature Implementation**: Complex functionality like analytics and file management
- **UI/UX Design**: Responsive design with multiple themes
- **Database Design**: Prisma schema with relationships
- **API Development**: RESTful endpoints and authentication
- **Error Handling**: Comprehensive error management

The AI-assisted development process showcased capabilities in:
- Understanding complex requirements
- Implementing modern web standards
- Creating maintainable, scalable code
- Integrating multiple technologies seamlessly

## 🚨 Important Notes

- **Private Instance**: This is designed as a private/application-only service requiring admin approval
- **Development Focus**: Primarily an experiment in AI-driven development
- **Security**: Implements proper authentication and authorization
- **Performance**: Optimized for small to medium-scale usage

## 📝 Contributing

While this is primarily an AI development experiment, contributions are welcome! Please note that major changes should maintain the project's experimental nature and cute aesthetic.

## 📄 License

This project is for educational and experimental purposes. Please ensure you have proper rights for any code or assets used.

---

*Made with AI assistance and lots of kawaii energy! (｡◕‿◕｡)*
