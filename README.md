# SiteGenesis AI - Multi-Tenant Content Generation Platform

A complete SaaS-like multi-tenant AI content generation platform that automatically generates entire websites for multiple tenants. Each tenant has its own branding, keywords, templates, ads, themes, and cron schedule.

## 🚀 Features

- **Multi-Tenant Architecture**: Separate websites for each tenant with isolated configurations
- **AI Content Generation**: Uses OpenAI/Gemini API to generate essays, speeches, and 10-line content
- **Automated Scheduling**: Cron-based system for automatic content generation
- **Template System**: EJS-based templating with tenant-specific customization
- **SEO Optimization**: Auto-generated sitemaps, robots.txt, and meta tags
- **Admin Dashboard**: Next.js dashboard for managing tenants, keywords, content, and templates
- **JWT Authentication**: Secure admin login with role-based access control
- **Internal Linking**: Automatic internal link management between content pieces

## 📁 Project Structure

```
project/
├── backend/              # Node.js + Express backend
│   ├── src/
│   │   ├── db.js         # MongoDB connection
│   │   ├── server.js     # Express server
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Route controllers
│   │   ├── models/       # Mongoose models
│   │   ├── generator/    # Content generation modules
│   │   ├── cron/         # Cron job scheduler
│   │   └── utils/        # Utility functions
│   ├── templates/        # Default EJS templates
│   └── tenants/          # Tenant-specific files
│       └── {tenantId}/
│           ├── config.json
│           ├── templates/
│           ├── public/
│           └── keywords.json
│
└── dashboard/            # Next.js frontend
    ├── app/              # Next.js app directory
    ├── components/       # React components
    └── lib/              # Utility functions
```

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **Mongoose** - MongoDB ODM
- **MongoDB Atlas** - Cloud database
- **OpenAI/Gemini API** - AI content generation
- **EJS** - HTML templating
- **node-cron** - Job scheduling
- **JWT** - Authentication

### Frontend
- **Next.js 14** - React framework
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **Axios** - HTTP client

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key or Gemini API key

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sitegenesis
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to dashboard directory:
```bash
cd dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file (optional):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

## 🚀 Usage

### 1. Initial Setup

1. Start both backend and frontend servers
2. Access the dashboard at `http://localhost:3000`
3. Login (you'll need to create the first admin user via API or directly in MongoDB)

### 2. Create a Tenant

1. Go to **Tenants** page
2. Click **Create Tenant**
3. Fill in:
   - Tenant ID (e.g., `site1`)
   - Name
   - Domain
   - Logo URL (optional)
   - AdSense Code (optional)
   - Posts per Day

### 3. Add Keywords

1. Go to **Keywords** page
2. Select a tenant
3. Add keywords individually or bulk import via CSV
4. Choose content type: Essay, Speech, or 10 Lines

### 4. Generate Content

**Automatic (Cron)**:
- Content is automatically generated based on each tenant's cron frequency
- Cron runs hourly and distributes posts throughout the day

**Manual**:
- Go to **Tenants** → Select tenant → Click **Generate Content Now**
- Or go to **Scheduler** → Click **Run Now** for a tenant

### 5. Customize Templates

1. Go to **Templates** page
2. Select a tenant
3. Edit the EJS template
4. Use preview to see changes
5. Save template

### 6. View Generated Content

1. Go to **Content** page
2. Filter by tenant or type
3. Preview, edit, or regenerate content
4. Generated HTML files are saved in `backend/tenants/{tenantId}/public/pages/`

## 📊 Database Models

### Tenant
- `_id`: Tenant identifier
- `name`: Display name
- `domain`: Website domain
- `logoUrl`: Logo image URL
- `adsenseCode`: Google AdSense code
- `theme`: Color theme configuration
- `cronFrequency`: Posts per day

### Keyword
- `tenantId`: Associated tenant
- `keyword`: Keyword text
- `type`: essay | speech | tenLines
- `status`: pending | generating | completed | failed
- `slug`: URL-friendly slug

### Content
- `tenantId`: Associated tenant
- `type`: Content type
- `slug`: URL slug
- `title`: Content title
- `content`: HTML content
- `sections`: Structured sections
- `faq`: FAQ array
- `meta`: SEO metadata
- `html`: Generated HTML page

### InternalLink
- `tenantId`: Associated tenant
- `slug`: Content slug
- `related`: Array of related slugs

## 🔐 Authentication

- JWT tokens stored in HTTPOnly cookies
- Role-based access: `admin` | `manager`
- Admin can create users, manage tenants
- Manager has limited access

## 📝 API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (admin only)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Tenants
- `GET /api/tenants` - List all tenants
- `GET /api/tenants/:id` - Get tenant
- `POST /api/tenants` - Create tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Keywords
- `GET /api/keywords` - List keywords (with filters)
- `POST /api/keywords` - Create keyword
- `POST /api/keywords/bulk` - Bulk create
- `PUT /api/keywords/:id` - Update keyword
- `DELETE /api/keywords/:id` - Delete keyword

### Content
- `GET /api/content` - List content (with filters)
- `GET /api/content/:id` - Get content
- `POST /api/content/generate/:tenantId` - Generate content
- `PUT /api/content/:id` - Update content
- `POST /api/content/:id/regenerate` - Regenerate content
- `DELETE /api/content/:id` - Delete content

### Templates
- `GET /api/template/:tenantId` - Get template
- `PUT /api/template/:tenantId` - Update template
- `POST /api/template/:tenantId/preview` - Preview template

### Cron
- `POST /api/cron/run/:tenantId` - Run cron for tenant
- `PUT /api/cron/update/:tenantId` - Update cron frequency

## 🔄 Cron System

- Runs hourly for all tenants
- Distributes posts throughout the day based on `cronFrequency`
- Automatically generates:
  - Content from pending keywords
  - HTML pages
  - Internal links
  - Sitemap.xml
  - robots.txt

## 📄 Generated Files

For each tenant, the system generates:
- `tenants/{tenantId}/public/pages/{slug}.html` - HTML pages
- `tenants/{tenantId}/public/sitemap.xml` - Sitemap
- `tenants/{tenantId}/public/robots.txt` - Robots file
- `tenants/{tenantId}/config.json` - Tenant configuration
- `tenants/{tenantId}/templates/page.ejs` - EJS template

## 🎨 Customization

### Themes
Each tenant can have:
- Primary color
- Mode: light | dark | auto

### Templates
Edit EJS templates with variables:
- `{{title}}` - Content title
- `{{content}}` - Main content
- `{{sections}}` - Structured sections
- `{{faq}}` - FAQ array
- `{{internalLinks}}` - Related links
- `{{adsense}}` - AdSense code
- `{{meta}}` - SEO metadata
- `{{tenant}}` - Tenant info

## 🔒 Security Features

- JWT authentication with HTTPOnly cookies
- HTML sanitization to prevent XSS
- Role-based access control
- Input validation
- CORS configuration

## 📈 Scalability

- Designed to handle 100+ tenants
- Efficient database indexing
- Pagination for large datasets
- Modular architecture
- Tenant isolation

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Verify all environment variables are set
- Check if port 5000 is available

### Content not generating
- Verify OpenAI/Gemini API keys
- Check keyword status in database
- Review backend logs

### Dashboard not connecting
- Verify `NEXT_PUBLIC_API_URL` matches backend URL
- Check CORS configuration
- Ensure backend is running

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ for automated content generation**

