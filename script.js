// GP1 Deployment Platform - Frontend Configurable Script

let pollingInterval;
let deploymentRunId = null;

// Function to get GitHub configuration from the frontend form
function getGitHubConfig() {
  const owner = document.getElementById('github-owner').value.trim();
  const repo = document.getElementById('github-repo').value.trim();
  
  if (!owner || !repo) {
    throw new Error('GitHub owner and repository name are required');
  }
  
  return { owner, repo };
}

// Function to save GitHub config to localStorage for convenience
function saveGitHubConfig(owner, repo) {
  localStorage.setItem('github_owner', owner);
  localStorage.setItem('github_repo', repo);
}

// Function to load saved GitHub config
function loadSavedGitHubConfig() {
  const savedOwner = localStorage.getItem('github_owner');
  const savedRepo = localStorage.getItem('github_repo');
  
  if (savedOwner) {
    document.getElementById('github-owner').value = savedOwner;
  }
  
  if (savedRepo) {
    document.getElementById('github-repo').value = savedRepo;
  }
}

// Main deployment function - gets config from frontend
async function triggerDeployment() {
  console.log('🚀 Starting deployment...');
  
  try {
    // Get GitHub configuration from form
    const gitHubConfig = getGitHubConfig();
    
    // Get form values
    const instanceType = document.getElementById('instance-type').value;
    const appType = document.getElementById('app-type').value;
    const repoUrl = document.getElementById('repo-url').value.trim();
    const cleanupAfter = document.getElementById('cleanup-after').checked;

    // Validate inputs
    if (!instanceType) {
      alert('❌ Please select an instance type');
      return;
    }
    
    if (!appType) {
      alert('❌ Please select an application type');
      return;
    }

    if (!repoUrl) {
      alert('❌ Please enter a repository URL');
      return;
    }

    if (!isValidRepoUrl(repoUrl)) {
      alert('❌ Please enter a valid GitHub repository URL (e.g., https://github.com/user/repo)');
      return;
    }

    // Save GitHub config for convenience
    saveGitHubConfig(gitHubConfig.owner, gitHubConfig.repo);

    // Get GitHub token
    const token = await getGitHubToken();
    if (!token) {
      console.log('❌ GitHub token required but not provided');
      return;
    }

    // Show deployment status section
    document.getElementById('deployment-status').style.display = 'block';
    
    // Update UI to show deployment is starting
    updateStatus('infra-status', 'Starting deployment...', 'running');
    updateStatus('app-status', 'Waiting for infrastructure...', 'pending');
    updateStatus('public-ip', 'Will be available in logs...', 'pending');
    
    // Disable deploy button during deployment
    const deployBtn = document.querySelector('.deploy-btn');
    deployBtn.disabled = true;
    deployBtn.innerHTML = '<span class="btn-icon">⏳</span> Deploying...';

    console.log('🔄 Triggering workflow with parameters:', {
      owner: gitHubConfig.owner,
      repo: gitHubConfig.repo,
      instance_type: instanceType,
      app_type: appType,
      repo_url: repoUrl,
      cleanup_after_deployment: cleanupAfter.toString()
    });

    // Trigger the workflow in the specified repository
    const response = await fetch(`https://api.github.com/repos/${gitHubConfig.owner}/${gitHubConfig.repo}/actions/workflows/deploy.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: 'main', // or 'master' if that's your default branch
        inputs: {
          instance_type: instanceType,
          app_type: appType,
          repo_url: repoUrl,
          cleanup_after_deployment: cleanupAfter.toString()
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to trigger workflow: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    console.log('✅ Workflow triggered successfully');
    updateStatus('infra-status', 'Workflow triggered successfully', 'running');
    
    // Add link to view the workflow runs
    addWorkflowLink(gitHubConfig);
    
    // Start monitoring the deployment
    setTimeout(() => {
      monitorDeployment(gitHubConfig);
    }, 5000); // Wait 5 seconds before starting to monitor

    alert(`🚀 Deployment started successfully!

⚙️ Configuration:
• Repository: ${gitHubConfig.owner}/${gitHubConfig.repo}
• Instance Type: ${instanceType}
• App Type: ${appType}
• Repository: ${repoUrl}
• Auto-cleanup: ${cleanupAfter ? 'Yes' : 'No'}

🔗 Monitor progress:
• Click "View Workflow" below to see real-time logs
• The EC2 public IP will be shown in the workflow summary
• Deployment typically takes 5-10 minutes`);

  } catch (error) {
    console.error('❌ Deployment error:', error);
    
    // Re-enable deploy button
    const deployBtn = document.querySelector('.deploy-btn');
    deployBtn.disabled = false;
    deployBtn.innerHTML = '<span class="btn-icon">🚀</span> Deploy EC2 Instance';
    
    updateStatus('infra-status', 'Failed to start', 'error');
    updateStatus('app-status', 'Failed', 'error');
    
    let errorMessage = '❌ Failed to start deployment!\n\n';
    
    if (error.message.includes('GitHub owner and repository name are required')) {
      errorMessage += 'Please fill in the GitHub owner and repository name in the configuration section.';
    } else if (error.message.includes('404')) {
      errorMessage += 'Possible causes:\n';
      errorMessage += '• Workflow file (.github/workflows/deploy.yml) not found\n';
      errorMessage += '• Repository name or owner incorrect\n';
      errorMessage += '• GitHub token doesn\'t have access to this repository';
    } else if (error.message.includes('403')) {
      errorMessage += 'Permission denied. Please check:\n';
      errorMessage += '• GitHub token has "repo" and "workflow" permissions\n';
      errorMessage += '• Token has access to this repository';
    } else {
      errorMessage += `Error: ${error.message}`;
    }
    
    alert(errorMessage);
  }
}

// Function to get GitHub Personal Access Token
async function getGitHubToken() {
  // Check if token is already stored
  let token = localStorage.getItem('github_token');
  
  if (!token) {
    // Prompt user for token
    const tokenInput = prompt(`🔐 GitHub Personal Access Token Required

To trigger the deployment workflow, please enter your GitHub Personal Access Token:

How to get a token:
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes: "repo" and "workflow"
4. Copy the token and paste it below

Your token will be stored locally in your browser.

Enter your GitHub token:`);
    
    if (!tokenInput || tokenInput.trim() === '') {
      alert('❌ GitHub token is required to trigger the deployment workflow.');
      return null;
    }
    
    token = tokenInput.trim();
    
    // Validate token format (basic check)
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      const proceed = confirm(`⚠️ The token format looks unusual. 

Expected formats:
• Classic tokens start with "ghp_"
• Fine-grained tokens start with "github_pat_"

Do you want to proceed anyway?`);
      
      if (!proceed) {
        return null;
      }
    }
    
    // Store token locally
    localStorage.setItem('github_token', token);
    console.log('✅ GitHub token stored locally');
  }
  
  return token;
}

// Function to monitor deployment progress
async function monitorDeployment(gitHubConfig) {
  const maxAttempts = 120; // Monitor for up to 60 minutes (30s intervals)
  let attempts = 0;
  
  const checkStatus = async () => {
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        console.error('❌ No GitHub token available for monitoring');
        return;
      }

      // Get workflow runs for the deploy.yml workflow
      const response = await fetch(`https://api.github.com/repos/${gitHubConfig.owner}/${gitHubConfig.repo}/actions/workflows/deploy.yml/runs?per_page=5`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workflow runs: ${response.status}`);
      }

      const data = await response.json();
      const runs = data.workflow_runs;
      
      if (runs && runs.length > 0) {
        // Get the most recent run
        const latestRun = runs[0];
        deploymentRunId = latestRun.id;
        
        console.log(`📊 Checking deployment status: ${latestRun.status} - ${latestRun.conclusion}`);
        updateDeploymentStatus(latestRun);
        
        // Update the workflow link with the actual run ID
        updateWorkflowLink(gitHubConfig, latestRun.id);
        
        if (latestRun.status === 'completed') {
          clearInterval(pollingInterval);
          
          if (latestRun.conclusion === 'success') {
            updateStatus('app-status', 'Complete ✅', 'success');
            updateStatus('public-ip', 'Check Workflow Logs ➡️', 'success');
            
            // Re-enable the deploy button
            const deployBtn = document.querySelector('.deploy-btn');
            deployBtn.disabled = false;
            deployBtn.innerHTML = '<span class="btn-icon">🚀</span> Deploy Another Instance';
            
            alert(`🎉 Deployment completed successfully!

🔗 Workflow Run: https://github.com/${gitHubConfig.owner}/${gitHubConfig.repo}/actions/runs/${latestRun.id}

🌐 The EC2 public IP address is available in the workflow logs!
Click "View Workflow Logs" below to get the IP address and access your application.`);
          } else {
            updateStatus('infra-status', `Failed: ${latestRun.conclusion}`, 'error');
            updateStatus('app-status', 'Failed', 'error');
            
            // Re-enable the deploy button
            const deployBtn = document.querySelector('.deploy-btn');
            deployBtn.disabled = false;
            deployBtn.innerHTML = '<span class="btn-icon">🚀</span> Retry Deployment';
            
            alert(`❌ Deployment failed! 

🔗 Check logs: https://github.com/${gitHubConfig.owner}/${gitHubConfig.repo}/actions/runs/${latestRun.id}

Common issues:
1. AWS secrets not added to repository
2. Invalid AWS credentials  
3. Insufficient AWS permissions
4. Application build/start errors`);
          }
          return; // Stop monitoring
        }
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(pollingInterval);
        updateStatus('infra-status', 'Timeout', 'error');
        updateStatus('app-status', 'Timeout', 'error');
        alert("⏰ Deployment monitoring timed out. Please check GitHub Actions manually.");
        
        // Re-enable the deploy button
        const deployBtn = document.querySelector('.deploy-btn');
        deployBtn.disabled = false;
        deployBtn.innerHTML = '<span class="btn-icon">🚀</span> Deploy EC2 Instance';
      }
    } catch (error) {
      console.error("❌ Error monitoring deployment:", error);
      attempts++;
      
      if (attempts >= 5) { // Stop monitoring after 5 consecutive errors
        clearInterval(pollingInterval);
        updateStatus('infra-status', 'Monitoring error', 'error');
        
        // Re-enable the deploy button
        const deployBtn = document.querySelector('.deploy-btn');
        deployBtn.disabled = false;
        deployBtn.innerHTML = '<span class="btn-icon">🚀</span> Deploy EC2 Instance';
      }
    }
  };
  
  // Start monitoring
  checkStatus();
  pollingInterval = setInterval(checkStatus, 30000); // Check every 30 seconds
}

// Function to update deployment status based on workflow run
function updateDeploymentStatus(run) {
  const status = run.status;
  const conclusion = run.conclusion;
  
  if (status === 'queued') {
    updateStatus('infra-status', 'Queued...', 'pending');
  } else if (status === 'in_progress') {
    updateStatus('infra-status', 'Provisioning Infrastructure...', 'running');
    updateStatus('app-status', 'Deploying Application...', 'running');
  } else if (status === 'completed') {
    if (conclusion === 'success') {
      updateStatus('infra-status', 'Infrastructure Ready ✅', 'success');
      updateStatus('app-status', 'Application Deployed ✅', 'success');
    } else {
      updateStatus('infra-status', `Failed: ${conclusion}`, 'error');
      updateStatus('app-status', 'Failed', 'error');
    }
  }
}

// Function to add workflow link to the UI
function addWorkflowLink(gitHubConfig) {
  let linkElement = document.getElementById('workflow-link');
  if (!linkElement) {
    const statusSection = document.getElementById('deployment-status');
    const linkDiv = document.createElement('div');
    linkDiv.className = 'status-item';
    linkDiv.innerHTML = `
      <span class="status-label">Workflow:</span>
      <a id="workflow-link" href="https://github.com/${gitHubConfig.owner}/${gitHubConfig.repo}/actions" target="_blank" class="repo-link">View Workflow Logs ➡️</a>
    `;
    statusSection.appendChild(linkDiv);
  }
}

// Function to update workflow link with specific run ID
function updateWorkflowLink(gitHubConfig, runId) {
  const linkElement = document.getElementById('workflow-link');
  if (linkElement && runId) {
    linkElement.href = `https://github.com/${gitHubConfig.owner}/${gitHubConfig.repo}/actions/runs/${runId}`;
    linkElement.textContent = 'View Workflow Logs ➡️';
  }
}

// Function to validate repository URL
function isValidRepoUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'github.com' && urlObj.pathname.split('/').length >= 3;
  } catch {
    return false;
  }
}

// Utility function to update status display
function updateStatus(elementId, text, type) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
    element.className = `status-value ${type}`;
  }
}

// Function to clear stored tokens and config
function clearGitHubToken() {
  localStorage.removeItem('github_token');
  localStorage.removeItem('github_owner');
  localStorage.removeItem('github_repo');
  
  // Clear the form fields
  document.getElementById('github-owner').value = '';
  document.getElementById('github-repo').value = '';
  
  alert("🔐 GitHub credentials and configuration cleared. You'll be prompted for new ones on next deployment.");
}

// Initialize the platform when the page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 GP1 Deployment Platform initialized');
  
  // Load saved GitHub configuration
  loadSavedGitHubConfig();
  
  // Check if GitHub token exists
  const token = localStorage.getItem('github_token');
  if (token) {
    console.log('✅ GitHub token found in local storage');
  } else {
    console.log('🔐 No GitHub token found - user will be prompted during deployment');
  }
  
  // Show helpful info about GitHub configuration
  const savedOwner = localStorage.getItem('github_owner');
  const savedRepo = localStorage.getItem('github_repo');
  
  if (savedOwner && savedRepo) {
    console.log(`📍 Saved GitHub Configuration: ${savedOwner}/${savedRepo}`);
  } else {
    console.log('⚙️ Please configure GitHub repository details before deployment');
  }
});
