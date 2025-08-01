# 🔐 AWS Credentials Setup Guide

## ❌ Current Issue
```
Error: Credentials could not be loaded, please check your action inputs: Could not
```

**This means your GitHub repository is missing AWS credentials.**

## ✅ Quick Fix (5 minutes)

### Step 1: Get AWS Credentials

1. **Go to AWS Console**: https://console.aws.amazon.com/
2. **Navigate to IAM**: Search for "IAM" in the top search bar
3. **Create/Use IAM User**:
   - Click **Users** → **Create user** (or use existing)
   - Username: `github-actions-user` (or any name)
   - **Attach policies directly**: 
     - ✅ `AmazonEC2FullAccess`
     - ✅ `AmazonSSMFullAccess`
4. **Create Access Key**:
   - Click on your user → **Security credentials** tab
   - **Create access key** → **Command Line Interface (CLI)**
   - ⚠️ **COPY BOTH VALUES** (you won't see them again!)

### Step 2: Add to GitHub Repository

1. **Go to your repo**: https://github.com/Nidhi-S12/Platform_Engg
2. **Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"** and add:

| Secret Name | Value | 
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | `AKIA...` (from Step 1) |
| `AWS_SECRET_ACCESS_KEY` | `wJa...` (from Step 1) |

### Step 3: Test Deployment

1. **Open your Golden Path platform**: `index.html`
2. **Select Golden Path 1**
3. **Enter repo URL**: `https://github.com/Vyshu890/node.js`
4. **Click Deploy** → Should work now! ✅

## 🛡️ Security Notes

- ✅ **Never commit AWS keys to Git**
- ✅ **Use IAM user (not root account)**
- ✅ **Keys are encrypted in GitHub Secrets**
- ✅ **You can rotate keys anytime in AWS Console**

## 🆘 Still Having Issues?

Check the **GitHub Actions logs**:
1. Go to your repo → **Actions** tab
2. Click on the latest workflow run
3. Look for detailed error messages

---

**Once you add the AWS credentials, your Golden Path 1 will work perfectly! 🚀**
