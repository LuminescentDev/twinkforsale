# 🌸 twink.forsale

> **⚠️ DISCLAIMER**: This project is mostly AI-generated and represents an exploration of how much functionality can be achieved through AI assistance. It serves as an experiment in AI-driven development rather than a production-ready application.

A cute and modern file hosting service with ShareX integration, Discord authentication, and a kawaii aesthetic. Perfect for sharing screenshots, images, and files with style! (◕‿◕)♡

## ✨ Features

### 🎨 Core Functionality
- **File Upload & Sharing**: Upload images, documents, and other files with automatic short URL generation
- **ShareX Integration**: One-click configuration for seamless ShareX uploads
- **Discord Authentication**: Secure OAuth login through Discord
- **Custom Domains**: Support for custom upload domains and subdomains
- **User Management**: Admin approval system with role-based access control
- **URL Shortening**: Create short links for any URL
- **Bio Pages**: Linktree-style bio pages with custom links and styling

### 📊 Analytics & Tracking
- **Detailed Analytics**: Track views, downloads, and user statistics
- **Real-time Charts**: Beautiful visualizations of upload and view data
- **File Management**: Organize and manage your uploads with advanced filtering
- **Storage Monitoring**: Track storage usage with configurable limits
- **Bio Analytics**: Track bio page views and link clicks

### 🎀 User Experience
- **Multiple Themes**: Choose from various cute themes (kawaii, cyberpunk, etc.)
- **Responsive Design**: Beautiful UI that works on all devices
- **Embed Customization**: Customize Discord embed appearance for your uploads
- **File Expiration**: Set expiration dates and view limits for uploads
- **oEmbed Support**: Rich embeds for files shared on Discord, Twitter, etc.

### 🔧 Advanced Features
- **API Keys**: Generate API keys for programmatic access
- **Batch Operations**: Select and manage multiple files at once
- **File Cleanup**: Automatic cleanup of expired files
- **Download Tracking**: Monitor file download statistics
- **Private Access**: Application-only access with admin approval required
- **System Monitoring**: Health checks and event logging with Discord notifications

## 🏗️ Architecture

**twink.forsale** is split into separate **backend** and **frontend** applications that can run independently:

### Backend (C# .NET 10.0)
- **API Framework**: ASP.NET Core with FastEndpoints
- **Database**: Entity Framework Core with PostgreSQL
- **Authentication**: JWT Bearer + API Key authentication
- **Storage**: Local filesystem or AWS S3
- **Image Processing**: ImageSharp for thumbnails and optimization
- **Logging**: Serilog with Grafana Loki integration

### Frontend (Qwik + TypeScript)
- **Framework**: Qwik 1.14.1 for optimal performance
- **Routing**: Qwik City with file-based routing
- **Styling**: Tailwind CSS v4 with custom themes
- **UI Components**: Custom component library with Lucide icons
- **API Client**: Auto-generated TypeScript client from backend OpenAPI

### Communication
- Frontend communicates with backend via REST API
- API URL configured via `API_URL` environment variable
- Includes proxy routes for ShareX compatibility and CORS handling

## 🚀 Tech Stack Summary

| Component | Technology |
|-----------|-----------|
| **Backend API** | C# .NET 10.0, FastEndpoints |
| **Frontend** | Qwik 1.14.1, TypeScript |
| **Database** | PostgreSQL (prod), SQLite (dev) |
| **ORM** | Entity Framework Core |
| **Auth** | JWT + API Keys |
| **Storage** | Local filesystem / AWS S3 |
| **Containerization** | Docker + Docker Compose |
| **Package Managers** | .NET SDK, pnpm |

## 📁 Project Structure

```
twinkforsale/
├── backend/                    # C# .NET API
│   ├── Endpoints/             # API endpoint handlers
│   │   ├── Upload/           # File upload endpoints
│   │   ├── Auth/             # Authentication
│   │   ├── Bio/              # Bio page management
│   │   ├── Admin/            # Admin operations
│   │   └── ...
│   ├── Entities/              # Database models (EF Core)
│   ├── Services/              # Business logic layer
│   │   ├── Auth/             # JWT, Discord OAuth
│   │   ├── Storage/          # File storage abstraction
│   │   └── Image/            # Image processing
│   ├── Data/                  # DbContext
│   ├── Program.cs            # Entry point
│   └── appsettings.json      # Configuration
│
├── frontend/                   # Qwik TypeScript app
│   ├── src/
│   │   ├── routes/           # File-based routing
│   │   │   ├── dashboard/   # User dashboard
│   │   │   ├── admin/       # Admin panel
│   │   │   ├── api/         # API proxy routes
│   │   │   ├── [username]/  # Bio pages
│   │   │   └── f/[code]/    # File viewing
│   │   ├── components/       # Reusable UI
│   │   ├── lib/              # Utilities & API client
│   │   │   └── api/generated/ # Auto-generated API client
│   │   └── global.css       # Global styles
│   ├── public/               # Static assets
│   └── package.json          # Frontend dependencies
│
├── docker/                     # Docker orchestration
│   └── docker-compose.yml    # Full stack composition
│
└── CLAUDE.md                   # AI assistant instructions
```

## 🛠️ Installation & Setup

### Prerequisites
- **.NET SDK 10.0+** for backend
- **Node.js 18.17+** or **20.3+** for frontend
- **pnpm 9+** (package manager for frontend)
- **PostgreSQL** (production) or SQLite (development)
- **Discord OAuth App** for authentication
- **Docker** (optional, for containerized deployment)

### Option 1: Docker Compose (Recommended)

Run the entire stack with one command:

```bash
# Start both backend and frontend
cd docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Ports:**
- Backend API: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:2345`

### Option 2: Run Independently

#### Backend Setup

```bash
cd backend

# Install dependencies (automatically handled by .NET)
dotnet restore

# Configure environment
cp appsettings.example.json appsettings.json
# Edit appsettings.json with your configuration

# Run database migrations
dotnet ef database update

# Start backend server
dotnet run
# API available at http://localhost:5000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env and set API_URL=http://localhost:5000

# Start development server
pnpm dev
# Frontend available at http://localhost:3000
```

## ⚙️ Configuration

### Backend Configuration (`backend/appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=twinkforsale;Username=postgres;Password=your_password"
  },
  "Jwt": {
    "Secret": "your-secret-key-minimum-32-characters",
    "Issuer": "twink.forsale",
    "Audience": "twink.forsale-api"
  },
  "Discord": {
    "ClientId": "your-discord-client-id",
    "ClientSecret": "your-discord-client-secret",
    "RedirectUri": "http://localhost:5000/auth/discord/callback"
  },
  "Storage": {
    "Provider": "Local",
    "BasePath": "./uploads",
    "MaxFileSize": 104857600,
    "AllowedExtensions": [".jpg", ".png", ".gif", ".webp", ".pdf", ".txt"]
  }
}
```

### Frontend Configuration (`frontend/.env`)

```env
# Backend API URL
API_URL=http://localhost:5000

# Optional: Override public URL for ShareX configs
PUBLIC_URL=http://localhost:3000
```

## 🎮 Usage

### For Users
1. **Sign Up**: Visit the frontend and use Discord OAuth to create an account
2. **Wait for Approval**: Admin approval required for new accounts
3. **Access Dashboard**: Once approved, access your dashboard at `/dashboard`
4. **Generate API Key**: Create API keys for ShareX integration
5. **Configure ShareX**: Download automatic configuration from `/dashboard/api-keys`
6. **Start Uploading**: Share files with cute short URLs!
7. **Create Bio Page**: Set up your Linktree-style bio at `/dashboard/bio`

### For Admins
- Access admin panel at `/admin`
- Approve/reject user registrations
- Manage upload domains
- View system analytics and health
- Monitor system events
- Perform file cleanup operations
- Configure user limits

## 📊 API Documentation

The backend provides **Swagger/OpenAPI documentation**:
- **Development**: `http://localhost:5000/swagger`
- **Production**: `https://your-api-domain/swagger`

### Key Endpoints

#### Upload API
```http
POST /api/upload
Authorization: Bearer <api-key>
Content-Type: multipart/form-data

file: <file-data>
maxViews: <optional-number>
expiresAt: <optional-iso-date>
```

**Response:**
```json
{
  "url": "https://twink.forsale/f/abc123",
  "deletionUrl": "https://twink.forsale/delete/xyz789",
  "thumbnailUrl": "https://twink.forsale/f/abc123?preview=true"
}
```

#### Authentication
```http
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/discord/callback
```

#### File Access
```http
GET /api/files/{shortCode}              # Get file metadata
GET /api/files/{shortCode}/download     # Download file
DELETE /api/uploads/{id}                # Delete upload (requires auth)
```

## 🐳 Docker Deployment

### Full Stack
```bash
cd docker
docker-compose up -d
```

### Backend Only
```bash
cd backend
docker-compose -f docker-compose.backend.yml up -d
```

### Frontend Only
```bash
cd frontend
docker-compose -f docker-compose.frontend.yml up -d
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **API Key Authentication**: Bearer token auth for uploads
- **Discord OAuth**: Trusted third-party authentication
- **Admin Approval**: Prevent unauthorized access
- **File Validation**: MIME type and extension checking
- **Storage Limits**: Per-user storage quotas
- **Rate Limiting**: Prevent abuse (configured in backend)
- **CORS Protection**: Controlled cross-origin requests

## 🎨 AI Development Notes

This project demonstrates extensive use of AI assistance in:
- **Migrating from TypeScript/Prisma to C#/Entity Framework**
- **Splitting a monolith into microservices architecture**
- **Full-stack development across different languages**
- **API design with REST best practices**
- **Database schema design and migrations**
- **Docker containerization and orchestration**
- **UI/UX design with modern frameworks**

The AI-assisted development showcased capabilities in:
- Understanding complex architectural requirements
- Implementing modern web standards
- Creating maintainable, scalable code across platforms
- Integrating multiple technologies seamlessly
- Handling cross-language type generation

## 🚨 Important Notes

- **Private Instance**: Designed as a private/application-only service requiring admin approval
- **Development Focus**: Primarily an experiment in AI-driven development
- **Security**: Implements proper authentication and authorization
- **Performance**: Optimized for small to medium-scale usage
- **Storage**: Configure appropriate storage backend (Local vs S3) for your needs

## 🔧 Development Commands

### Backend
```bash
dotnet run                      # Start backend server
dotnet build                    # Build project
dotnet test                     # Run tests
dotnet ef migrations add <Name> # Create migration
dotnet ef database update       # Apply migrations
```

### Frontend
```bash
pnpm dev                        # Start dev server
pnpm build                      # Build for production
pnpm preview                    # Preview production build
pnpm fmt                        # Format code
pnpm lint                       # Lint code
```

## 📝 Contributing

While this is primarily an AI development experiment, contributions are welcome! Please note that major changes should maintain the project's experimental nature and cute aesthetic.

## 📄 License

This project is for educational and experimental purposes. Please ensure you have proper rights for any code or assets used.

---

*Made with AI assistance and lots of kawaii energy! (｡◕‿◕｡)*

## 🔗 Architecture Decisions

### Why Split Backend and Frontend?

1. **Technology Choice**: C# offers better performance and type safety for API services
2. **Scalability**: Independent scaling of frontend and backend
3. **Deployment Flexibility**: Deploy components separately or together
4. **Development**: Teams can work independently on each component
5. **Specialization**: Use the best tool for each job (Qwik for frontend, .NET for API)

### API Proxy Routes

The frontend includes proxy routes at `/api/*` that forward requests to the backend. These serve important purposes:

- **ShareX Compatibility**: ShareX configs can use the same domain
- **CORS Handling**: Simplified CORS configuration
- **Request Monitoring**: Frontend can track upload failures
- **Unified Domain**: Users only need to know one URL

### Future Improvements

- Move system monitoring from frontend to backend
- Extract shared types into a separate package
- Add end-to-end tests for critical flows
- Implement GraphQL for more efficient data fetching
- Add WebSocket support for real-time updates
