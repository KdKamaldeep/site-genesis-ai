# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
# OR
GEMINI_API_KEY=your-gemini-key
FRONTEND_URL=http://localhost:3000
```

Create first admin user:
```bash
npm run create-admin
# Or with custom credentials:
npm run create-admin admin@example.com password123 admin
```

Start backend:
```bash
npm run dev
```

### Step 2: Frontend Setup

```bash
cd dashboard
npm install
```

Start frontend:
```bash
npm run dev
```

### Step 3: Access Dashboard

1. Open `http://localhost:3000`
2. Login with the admin credentials you created
3. Start creating tenants and adding keywords!

## 📝 Basic Workflow

1. **Create Tenant**: Go to Tenants → Create Tenant
   - Enter Tenant ID (e.g., `site1`)
   - Fill in name, domain, etc.

2. **Add Keywords**: Go to Keywords → Add Keyword
   - Select tenant
   - Enter keyword
   - Choose type (essay/speech/tenLines)

3. **Generate Content**: 
   - Automatic: Cron runs hourly
   - Manual: Go to Tenants → Select tenant → "Generate Content Now"

4. **View Content**: Go to Content page to see generated articles

5. **Customize**: Edit templates in Templates page

## 🎯 Next Steps

- Add more keywords (bulk import via CSV)
- Customize EJS templates per tenant
- Configure AdSense codes
- Set cron frequencies per tenant
- Deploy generated HTML files to your hosting

## 🔧 Troubleshooting

**Can't login?**
- Make sure you created an admin user: `npm run create-admin`

**Content not generating?**
- Check API keys in `.env`
- Verify keywords are in "pending" status
- Check backend logs for errors

**Dashboard not connecting?**
- Ensure backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in dashboard

## 📚 Full Documentation

See [README.md](./README.md) for complete documentation.

