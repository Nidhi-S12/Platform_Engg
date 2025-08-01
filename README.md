# 🚀 EC2 Deployment Platform

A complete CI/CD pipeline that automates the provisioning of AWS EC2 instances via Terraform and deploys web applications with SSH-based access, all triggered from a professional frontend interface.

## 🎯 Features

- **🖥️ Professional Frontend**: Clean, responsive HTML/CSS interface
- **🔄 Automated CI/CD**: GitHub Actions workflow for complete automation
- **🏗️ Infrastructure as Code**: Terraform-based EC2 provisioning
- **🔐 Secure SSH Access**: Automatic SSH key generation and management
- **📦 Multi-App Support**: Supports Node.js, Python, and static websites
- **📊 Real-time Monitoring**: Deployment status tracking and notifications
- **🛡️ Security Best Practices**: Encrypted secrets and least-privilege access

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS) → GitHub Actions API → Terraform → EC2 Instance → Application Deployment
```

## 📋 Prerequisites

### 1. AWS Account Setup
- AWS account with appropriate permissions
- AWS CLI configured or AWS credentials available

### 2. GitHub Repository Setup
- Fork or clone this repository
- Enable GitHub Actions in your repository

### 3. Required GitHub Secrets
Add the following secrets to your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### 4. IAM Permissions
Your AWS user/role needs these permissions:
- EC2 full access (or specific permissions for instances, security groups, key pairs)
- SSM Parameter Store access (for storing SSH keys)

## 🚀 Quick Start

### 1. Update Configuration
Edit `script.js` and update the GitHub configuration:
```javascript
const GITHUB_CONFIG = {
  owner: 'your-github-username',
  repo: 'your-repo-name',
  token: null,
  workflow_id: 'deploy.yml'
};
```

### 2. Open the Frontend
- Open `index.html` in a web browser or serve it via a web server
- Fill in the deployment form:
  - **Instance Type**: Choose from t2.micro, t2.small, or t2.medium
  - **Application Type**: Select nodejs, python, or static
  - **Repository URL**: Enter the Git repository URL to deploy

### 3. Generate GitHub Personal Access Token
- Go to GitHub Settings → Developer settings → Personal access tokens
- Generate a token with `workflow` and `repo` permissions
- Copy the token for use in the frontend

### 4. Deploy
- Click "Deploy EC2 Instance"
- Enter your GitHub token when prompted
- Monitor the deployment progress in the status section

## 📁 Project Structure

```
platform/
├── index.html              # Frontend interface
├── style.css               # Styling for the frontend
├── script.js               # Frontend JavaScript logic
├── deploy.sh               # Standalone deployment script
├── catalog.json            # VM configuration catalog
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions workflow
└── terraform-root/
    └── modules/
        └── ec2/
            ├── main.tf     # Terraform EC2 configuration
            ├── variables.tf # Terraform variables
            └── outputs.tf  # Terraform outputs
```

## 🔧 Terraform Configuration

### Key Components

1. **SSH Key Generation**: Automatically generates RSA key pairs
2. **Security Groups**: Configures appropriate firewall rules
3. **EC2 Instance**: Provisions with user data for initial setup
4. **Parameter Store**: Securely stores SSH private keys
5. **Outputs**: Exports instance details for deployment

### Variables
- `instance_type`: EC2 instance size (t2.micro, t2.small, t2.medium)
- `app_type`: Application type (nodejs, python, static)
- `repo_url`: Git repository to deploy
- `instance_name`: Name for the EC2 instance

## 🔄 GitHub Actions Workflow

The deployment workflow consists of three main jobs:

### 1. `terraform-deploy`
- Sets up Terraform
- Provisions EC2 infrastructure
- Generates and stores SSH keys
- Outputs instance details

### 2. `deploy-application`
- Connects to EC2 via SSH
- Clones the specified repository
- Deploys the application based on type
- Tests the deployment

### 3. `cleanup` (optional)
- Destroys infrastructure if deployment fails
- Can be configured for automatic cleanup

## 🔐 Security Considerations

1. **SSH Key Management**: Private keys are encrypted and stored in AWS SSM
2. **GitHub Secrets**: AWS credentials stored as encrypted GitHub secrets
3. **Network Security**: Security groups configured with minimal required access
4. **Token Security**: GitHub tokens should have minimal required permissions

## 📱 Application Types

### Node.js Applications
- Requires `package.json`
- Runs on port 3000 (default)
- Uses `npm start` command

### Python Applications
- Optional `requirements.txt` for dependencies
- Runs on port 5000 (default)
- Looks for `app.py`, `main.py`, or `server.py`

### Static Websites
- Deploys to nginx
- Serves on port 80
- Copies all files to `/var/www/html/`

## 🐛 Troubleshooting

### Common Issues

1. **GitHub API Rate Limits**
   - Use a personal access token with appropriate scopes
   - Avoid triggering multiple deployments simultaneously

2. **AWS Permissions**
   - Ensure your AWS credentials have EC2 and SSM permissions
   - Check CloudTrail logs for permission denials

3. **Application Deployment Failures**
   - Check the GitHub Actions logs for detailed error messages
   - SSH into the instance to check application logs

4. **Network Connectivity**
   - Verify security group rules allow inbound traffic
   - Check if the application is binding to the correct interface

### Debug Commands

SSH into your EC2 instance:
```bash
ssh -i your-key.pem ec2-user@your-instance-ip
```

Check application logs:
```bash
cd /home/ec2-user/app
cat app.log
```

Check running processes:
```bash
ps aux | grep -E "(node|python3|nginx)"
```

## 🔄 Manual Deployment

You can also use the standalone deployment script:

```bash
# On the EC2 instance
./deploy.sh --repo-url https://github.com/user/repo --app-type nodejs
```

## 📊 Monitoring and Logs

- **GitHub Actions**: Check the Actions tab in your repository
- **Application Logs**: Available at `/home/ec2-user/app/app.log`
- **System Logs**: Use `journalctl` on the EC2 instance
- **AWS CloudWatch**: EC2 instance metrics and logs

## 🚧 Future Enhancements

- [ ] Support for Docker applications
- [ ] Integration with AWS Load Balancer
- [ ] Blue-green deployment strategy
- [ ] Custom domain and SSL certificate setup
- [ ] Database integration (RDS, DynamoDB)
- [ ] Monitoring with CloudWatch dashboards
- [ ] Slack/Email notifications
- [ ] Cost optimization features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review GitHub Actions logs
3. Check AWS CloudTrail for API calls
4. Open an issue in this repository

---

**Happy Deploying! 🚀**
