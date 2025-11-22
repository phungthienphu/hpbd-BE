# Bday Backend API

Backend API cho dự án Birthday, sử dụng Express.js và Cloudinary.

## 🚀 Quick Start

### Local Development
```bash
npm install
npm run dev
```

Server sẽ chạy tại `http://localhost:4000`

### Deploy lên Vercel
```bash
vercel --prod
```

## 📚 API Documentation

Xem file [API_DOCS.md](./API_DOCS.md) để biết chi tiết về các endpoints.

### Quick Examples

**Health Check:**
```bash
curl https://your-project.vercel.app/
```

**Get Folders:**
```bash
curl https://your-project.vercel.app/cloudinary/folders
```

**Get Images:**
```bash
curl https://your-project.vercel.app/cloudinary/images?folder=PHU/Album1
```

## 🧪 Testing

Test API với script có sẵn:
```bash
# Test local
node test-api.js

# Test production
node test-api.js https://your-project.vercel.app
```

## 📁 Project Structure

```
src/
├── app.js              # Express app (shared)
├── index.js            # Local dev entry point
├── routers/
│   └── cloudinary.js   # Cloudinary routes
└── services/
    └── cloudinaryService.js  # Cloudinary service logic
api/
└── index.js            # Vercel serverless function
```

## ⚙️ Environment Variables

Cần set các biến sau trên Vercel hoặc trong `.env` file:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

