# StudyAI Production Deployment Guide
# Making Study-AI.io Accessible to Everyone on the Internet

## 🌍 Overview
This guide will help you deploy StudyAI Platform to the Study-AI.io domain, making it accessible to users worldwide.

## 📋 Prerequisites
- [x] Code configured for Study-AI.io domain
- [ ] Domain purchased (Study-AI.io)
- [ ] Cloud hosting account
- [ ] SSL certificate setup

## 🏗️ Deployment Options

### Option 1: Vercel + Railway (Recommended)
**Frontend (Vercel):**
1. Push code to GitHub repository
2. Connect Vercel to your GitHub repo
3. Configure custom domain: study-ai.io
4. Deploy frontend build

**Backend (Railway):**
1. Connect Railway to your GitHub repo
2. Configure environment variables
3. Set up custom domain: api.study-ai.io
4. Deploy backend service

### Option 2: Netlify + Heroku
**Frontend (Netlify):**
1. Build frontend: `npm run build`
2. Deploy build folder to Netlify
3. Configure custom domain: study-ai.io

**Backend (Heroku):**
1. Create Heroku app
2. Configure environment variables
3. Deploy backend code
4. Set up custom domain: api.study-ai.io

### Option 3: AWS (Advanced)
**Frontend (S3 + CloudFront):**
1. Build and upload to S3 bucket
2. Configure CloudFront distribution
3. Set up Route 53 for domain

**Backend (EC2 + Load Balancer):**
1. Deploy to EC2 instance
2. Configure Application Load Balancer
3. Set up SSL certificate

## 🔧 Domain Configuration

### DNS Records Required:
```
Type    Name            Value
A       study-ai.io     [Frontend IP]
CNAME   www             study-ai.io
A       api             [Backend IP]
```

### SSL Certificates:
- study-ai.io (frontend)
- api.study-ai.io (backend)

## 🚀 Quick Deploy Commands

### Build for Production:
```powershell
# Run the deployment script
.\deploy-production.ps1
```

### Deploy Frontend (after hosting setup):
```bash
cd frontend
npm run build
# Upload build/ folder to your hosting provider
```

### Deploy Backend:
```bash
cd backend
# Configure environment variables on hosting platform
# Deploy backend code to server
```

## 🌐 Environment Variables for Production

### Backend (.env):
```
NODE_ENV=production
DOMAIN_URL=study-ai.io
FRONTEND_URL=https://study-ai.io
PUBLIC_BACKEND_URL=https://api.study-ai.io
PORT=3001
HOST=0.0.0.0
```

### Frontend (.env.production):
```
REACT_APP_API_URL=https://api.study-ai.io
REACT_APP_DOMAIN=study-ai.io
REACT_APP_FRONTEND_URL=https://study-ai.io
REACT_APP_ENV=production
```

## 📊 Monitoring & Analytics

### Health Checks:
- Frontend: https://study-ai.io
- Backend: https://api.study-ai.io/health

### Performance Monitoring:
- Set up monitoring (New Relic, DataDog, etc.)
- Configure error tracking (Sentry)
- Enable analytics (Google Analytics)

## 🔒 Security Considerations

### Production Security:
- Enable HTTPS everywhere
- Configure proper CORS origins
- Use environment variables for secrets
- Set up rate limiting
- Enable security headers

### OAuth Configuration:
Update redirect URIs in cloud provider consoles:
- Google: https://api.study-ai.io/api/cloud/callback/googledrive
- Microsoft: https://api.study-ai.io/api/cloud/callback/onedrive
- Apple: https://api.study-ai.io/api/cloud/callback/icloud

## 📈 Scaling Considerations

### Traffic Management:
- CDN for static assets
- Database connection pooling
- Load balancing for high traffic
- Auto-scaling configuration

### Performance Optimization:
- Enable gzip compression
- Optimize bundle sizes
- Use caching strategies
- Implement lazy loading

## 🆘 Troubleshooting

### Common Issues:
1. **CORS Errors**: Check backend CORS configuration
2. **SSL Issues**: Verify certificate installation
3. **API Connectivity**: Ensure backend is accessible
4. **OAuth Failures**: Check redirect URI configuration

### Debug Commands:
```bash
# Test backend connectivity
curl https://api.study-ai.io/health

# Check DNS resolution
nslookup study-ai.io

# Verify SSL certificate
openssl s_client -connect study-ai.io:443
```

## 📞 Support Resources

### Documentation:
- [Vercel Deployment](https://vercel.com/docs)
- [Railway Deployment](https://docs.railway.app)
- [Netlify Deployment](https://docs.netlify.com)

### Community:
- GitHub Issues for bug reports
- Discord for real-time support
- Documentation wiki

## ✅ Final Checklist

Before going live:
- [ ] Domain purchased and configured
- [ ] Frontend deployed and accessible
- [ ] Backend deployed and responding
- [ ] SSL certificates installed
- [ ] OAuth providers configured
- [ ] Health checks passing
- [ ] Monitoring setup
- [ ] Backup strategy in place

## 🎉 Go Live!

Once everything is configured:
1. Test all functionality at https://study-ai.io
2. Verify cloud storage integrations work
3. Test AI quiz generation
4. Monitor for any issues
5. Share with the world! 🌍

**Your StudyAI Platform will be accessible at: https://study-ai.io**