# 🚀 EC2 Deployment Platform - Complete Setup Guide

## 📋 Prerequisites

### 1. AWS Account Setup
- Active AWS account with billing enabled
- IAM user with programmatic access (Access Key + Secret Key)

### 2. Required AWS Permissions
Your AWS IAM user needs these permissions:
- **EC2**: Full access (create instances, security groups, key pairs)
- **SSM**: Parameter Store access (for storing SSH keys)
- **VPC**: Basic access (if using custom VPC)

### 3. GitHub Account & Repository
- GitHub account with this repository
- Repository must have GitHub Actions enabled

## 🔧 Step-by-Step Setup

### Step 1: Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/Purvash-143/platform.git
cd platform

# Ensure all files are present
ls -la
```

### Step 2: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these **Repository Secrets**:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | Your AWS Access Key | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Key | IAM user secret key |
| `AWS_DEFAULT_REGION` | `us-east-1` (or preferred) | AWS region for deployment |

### Step 3: Generate GitHub Personal Access Token

1. Go to **GitHub.com** → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **"Generate new token (classic)"**
3. Configure the token:
   - **Note**: "EC2 Deployment Platform"
   - **Expiration**: Choose based on your needs
   - **Scopes**: Select these permissions:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)
     - ✅ `actions:write` (Write access to GitHub Actions)

4. **Copy the token** - you'll need it for the frontend

### Step 4: Update Configuration

Edit `script.js` and update the GitHub configuration:

```javascript
const GITHUB_CONFIG = {
  owner: 'YOUR_GITHUB_USERNAME',    // Replace with your GitHub username
  repo: 'platform',                 // Keep as 'platform' or change to your repo name
  token: null,                      // Will be set from user input
  workflow_id: 'deploy.yml'
};
```

### Step 5: Test the Setup

1. **Enable GitHub Actions** (if not already enabled):
   - Go to your repository → **Actions** tab
   - If prompted, click **"I understand my workflows, go ahead and enable them"**

2. **Manual Test** (Optional):
   - Go to **Actions** → **Deploy EC2 Instance with Application**
   - Click **"Run workflow"**
   - Fill in test parameters and run

### Step 6: Deploy the Frontend

You can deploy the frontend in several ways:

#### Option A: Local Development
```bash
# Navigate to the platform directory
cd platform

# Open with a simple HTTP server (Python)
python -m http.server 8000

# Or use Node.js
npx http-server -p 8000

# Open browser to http://localhost:8000
```

#### Option B: GitHub Pages
1. Go to repository **Settings** → **Pages**
2. Set **Source** to "Deploy from a branch"
3. Select **main** branch and **/ (root)** folder
4. Access your site at `https://YOUR_USERNAME.github.io/platform`

#### Option C: Netlify/Vercel
1. Connect your GitHub repository to Netlify or Vercel
2. Set build command: (none needed)
3. Set publish directory: `/` (root)

## 🎯 How to Use the Platform

### 1. Open the Frontend
- Navigate to your deployed frontend URL
- You should see the "EC2 Deployment Platform" interface

### 2. Configure Deployment
- **Instance Type**: Choose t2.micro, t2.small, or t2.medium
- **Application Type**: Select nodejs, python, or static
- **Repository URL**: Enter a public GitHub repository URL to deploy

### 3. Deploy
1. Click **"Deploy EC2 Instance"**
2. Enter your GitHub Personal Access Token when prompted
3. Monitor the deployment progress in real-time
4. Access your application once deployment completes

### 4. Access Your Application
After successful deployment:
- **Node.js apps**: `http://YOUR_EC2_IP:3000`
- **Python apps**: `http://YOUR_EC2_IP:5000`
- **Static sites**: `http://YOUR_EC2_IP`

## 📱 Example Applications to Deploy

### Node.js Example
```bash
# Sample Node.js app repository
https://github.com/vercel/next.js/tree/canary/examples/hello-world
```

### Python Flask Example
```bash
# Sample Flask app repository
https://github.com/pallets/flask/tree/main/examples/tutorial
```

### Static Website Example
```bash
# Sample static website
https://github.com/microsoft/Web-Dev-For-Beginners
```

## 🔍 Monitoring & Troubleshooting

### Check Deployment Status
1. **Frontend**: Monitor real-time status in the web interface
2. **GitHub Actions**: Go to repository → Actions tab → View workflow runs
3. **AWS Console**: Check EC2 instances, security groups, key pairs

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Token invalid" | Incorrect GitHub token | Regenerate token with correct permissions |
| "AWS credentials not found" | Missing AWS secrets | Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to GitHub secrets |
| "Repository not found" | Private repo or wrong URL | Use public repository or check URL format |
| "Terraform init failed" | Missing permissions | Ensure AWS IAM user has EC2 permissions |
| "SSH connection failed" | Security group issues | Check that ports 22, 80, 3000, 5000 are open |

### Debug Commands

**Check GitHub Actions logs:**
```bash
# View workflow runs via GitHub CLI (optional)
gh run list --repo YOUR_USERNAME/platform
gh run view RUN_ID --repo YOUR_USERNAME/platform
```

**SSH into EC2 instance:**
```bash
# Get SSH command from GitHub Actions logs or AWS console
ssh -i your-key.pem ec2-user@YOUR_EC2_IP

# Check application logs
cd /home/ec2-user/app
cat app.log

# Check running processes
ps aux | grep -E "(node|python3|nginx)"
```

## 🛡️ Security Best Practices

1. **GitHub Token**: Use minimal required permissions, set expiration
2. **AWS Credentials**: Use IAM user (not root), minimal permissions
3. **EC2 Security**: Review security group rules, update AMIs regularly
4. **Secrets Management**: Never commit secrets to repository

## 🔄 Pipeline Features

### What the Pipeline Does:
1. **Infrastructure Provisioning**:
   - Creates EC2 instance with selected specifications
   - Generates SSH key pair automatically
   - Sets up security groups with required ports
   - Stores SSH private key in AWS SSM Parameter Store

2. **Application Deployment**:
   - Connects to EC2 via SSH using generated key
   - Clones specified GitHub repository
   - Installs dependencies based on application type
   - Starts application in background
   - Tests deployment

3. **Monitoring & Cleanup**:
   - Provides real-time deployment status
   - Offers optional cleanup on failure
   - Generates deployment summary with access URLs

### Supported Application Types:
- **Node.js**: Looks for `package.json`, runs `npm install` and `npm start`
- **Python**: Installs from `requirements.txt`, runs `app.py` or `main.py`
- **Static**: Deploys to nginx, serves on port 80

## 🚀 Ready to Deploy!

You're now ready to use your complete CI/CD pipeline! The platform will:

✅ **Generate PEM keys automatically**  
✅ **Store keys securely in AWS SSM**  
✅ **Handle SSH connections automatically**  
✅ **Deploy applications based on type**  
✅ **Provide real-time status updates**  
✅ **Clean up on failures (optional)**  

**Start by opening your frontend and deploying your first application!**

---

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review GitHub Actions logs
3. Check AWS CloudTrail for API calls
4. Open an issue in the repository

**Happy Deploying! 🎉**
