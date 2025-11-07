# Deployment Guide - Frontend on EC2 with Docker

## Prerequisites
- EC2 instance with Docker and Docker Compose installed
- Backend already running on the same EC2
- Domain or EC2 public IP address

## Step 1: Prepare Environment Variables

1. Create `.env.production` from the example:
   ```bash
   cp .env.production.example .env.production
   ```

2. Update `.env.production` with your EC2 details:
   - Replace `your-ec2-ip-or-domain.com` with your actual domain/IP
   - Example: `http://3.108.45.123:8088` or `http://api.example.com:8088`

3. **Important**: The build process will embed these values at build time

## Step 2: Update Cognito Settings

Go to AWS Cognito Console and update your app client:

1. **Allowed callback URLs**: Add
   - `http://your-ec2-domain.com/dashboard`
   - `https://your-ec2-domain.com/dashboard` (if using HTTPS)

2. **Allowed sign-out URLs**: Add
   - `http://your-ec2-domain.com/track`
   - `https://your-ec2-domain.com/track` (if using HTTPS)

## Step 3: Copy Files to EC2

From your local machine:

```powershell
# Option A: Using SCP
scp -r . ec2-user@your-ec2-ip:/path/to/your/backend/tracking-hub/

# Option B: Using Git (recommended)
# On EC2:
cd /path/to/your/backend/
git clone <your-frontend-repo>
cd tracking-hub
cp .env.production.example .env.production
# Edit .env.production with actual values
nano .env.production
```

## Step 4: Update docker-compose.yml

Add the frontend service from `docker-compose.example.yml` to your existing `docker-compose.yml`:

```bash
# On EC2
nano docker-compose.yml
# Copy the frontend service configuration
```

Make sure:
- `context: ./tracking-hub` points to the correct frontend folder
- `depends_on` references your actual backend service name
- Ports don't conflict with existing services

## Step 5: Build and Deploy

```bash
# On EC2
cd /path/to/your/backend/

# Build the frontend (this uses .env.production)
docker-compose build frontend

# Start the frontend
docker-compose up -d frontend

# Check logs
docker-compose logs -f frontend
```

## Step 6: Verify Deployment

1. Check container status:
   ```bash
   docker-compose ps
   ```

2. Test the frontend:
   ```bash
   curl http://localhost/health
   # Should return "healthy"
   ```

3. Open in browser:
   ```
   http://your-ec2-ip/
   ```

## Troubleshooting

### Frontend can't connect to backend
- Check `VITE_API_BASE_URL` in `.env.production`
- Verify backend is accessible: `curl http://localhost:8088/api/delivery/hubs`
- Check EC2 security group allows port 8088

### OAuth redirect fails
- Verify Cognito callback URLs match your EC2 domain exactly
- Check `VITE_OAUTH_REDIRECT_URI` in `.env.production`
- Ensure port 80 is open in EC2 security group

### Container won't start
```bash
# Check build logs
docker-compose logs frontend

# Rebuild from scratch
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Need to update environment variables
```bash
# Edit .env.production
nano .env.production

# Rebuild and restart (env vars are baked into build)
docker-compose build frontend
docker-compose up -d frontend
```

## Adding HTTPS (Recommended for Production)

### Option 1: Using Nginx + Let's Encrypt on EC2

1. Install certbot on EC2:
   ```bash
   sudo yum install certbot python3-certbot-nginx
   ```

2. Update nginx.conf to include SSL configuration

3. Get certificate:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

### Option 2: Using AWS Application Load Balancer
- Create ALB with SSL certificate
- Point to EC2 instance on port 80
- Update Cognito URLs to use HTTPS

## Updating the Frontend

```bash
# On EC2
cd /path/to/your/backend/tracking-hub/
git pull  # or upload new files

# Rebuild and restart
docker-compose build frontend
docker-compose up -d frontend
```

## Clean Up

```bash
# Stop frontend
docker-compose stop frontend

# Remove frontend container
docker-compose rm -f frontend

# Remove image
docker-compose down --rmi local
```
