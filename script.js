// Golden Path Deployment Platform - Main Script

let pollingInterval;
let deploymentRunId = null;
let selectedGoldenPath = null;

// GitHub Configuration - Auto-detected from hosted environment
const GITHUB_CONFIG = {
  owner: 'Nidhi-S12', // Auto-detected from repository
  repo: 'Platform_Engg', // Auto-detected from repository
  token: null // Will be requested only when needed
};

// Load Golden Paths from catalog
async function loadGoldenPaths() {
  try {
    const response = await fetch('./catalog.json');
    const goldenPaths = await response.json();
    
    const container = document.getElementById('golden-paths-container');
    container.innerHTML = '';
    
    goldenPaths.forEach(path => {
      const pathCard = createGoldenPathCard(path);
      container.appendChild(pathCard);
    });
    
    console.log('✅ Golden Paths loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load Golden Paths:', error);
    document.getElementById('golden-paths-container').innerHTML = 
      '<p style="color: #e74c3c; text-align: center;">Failed to load Golden Paths. Please refresh the page.</p>';
  }
}

// Create Golden Path Card
function createGoldenPathCard(path) {
  const card = document.createElement('div');
  card.className = 'golden-path-card';
  card.dataset.pathId = path.id;
  
  // Add disabled state for non-functional paths
  if (path.status === 'coming_soon') {
    card.classList.add('coming-soon');
  }
  
  card.innerHTML = `
    <div class="path-name">
      ${path.name}
      ${path.status === 'coming_soon' ? '<span class="coming-soon-badge">Coming Soon</span>' : ''}
    </div>
    <div class="path-description">${path.description}</div>
    <div class="path-tech-stack">
      ${path.tech_stack.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
    </div>
    <ul class="path-features">
      ${path.features.map(feature => `<li>${feature}</li>`).join('')}
    </ul>
  `;
  
  // Add click handler only for functional paths
  if (path.status !== 'coming_soon') {
    card.addEventListener('click', () => selectGoldenPath(path));
  }
  
  return card;
}

// Select Golden Path
function selectGoldenPath(path) {
  // Remove previous selection
  document.querySelectorAll('.golden-path-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Select current path
  const selectedCard = document.querySelector(`[data-path-id="${path.id}"]`);
  selectedCard.classList.add('selected');
  
  selectedGoldenPath = path;
  
  // Show configuration section
  const configSection = document.getElementById('config-section');
  configSection.style.display = 'block';
  
  // Load configuration options
  loadConfigurationOptions(path);
  
  // Enable deploy button
  updateDeployButtonState();
  
  console.log(`✅ Selected Golden Path: ${path.name}`);
}

// Load Configuration Options
function loadConfigurationOptions(path) {
  const configContainer = document.getElementById('config-options');
  
  if (path.id === 'gp1') {
    // GP1 - EC2 Configuration
    configContainer.innerHTML = `
      <div class="config-group">
        <label for="instance-type">Instance Type:</label>
        <select id="instance-type" class="form-select">
          <option value="t2.micro">t2.micro (1 vCPU, 1 GB RAM) - Free Tier</option>
          <option value="t2.small">t2.small (1 vCPU, 2 GB RAM)</option>
          <option value="t2.medium">t2.medium (2 vCPU, 4 GB RAM)</option>
        </select>
      </div>
      <div class="config-group">
        <label for="app-type">Application Type:</label>
        <select id="app-type" class="form-select">
          <option value="nodejs">Node.js Application</option>
          <option value="python">Python Application</option>
          <option value="static">Static Website</option>
        </select>
      </div>
      <div class="config-info">
        <p><strong>🔧 Auto-Configuration:</strong> The system will automatically detect your application type and configure the appropriate runtime environment.</p>
      </div>
    `;
  } else {
    // Coming soon paths
    configContainer.innerHTML = `
      <div class="coming-soon-config">
        <h4>🚧 Configuration Coming Soon</h4>
        <p>This Golden Path is currently under development. Advanced configuration options will be available soon, including:</p>
        <ul>
          <li>Kubernetes cluster sizing</li>
          <li>Security scanning preferences</li>
          <li>Monitoring and alerting setup</li>
          <li>Custom deployment strategies</li>
        </ul>
        <p><strong>Stay tuned for updates!</strong></p>
      </div>
    `;
  }
}

// Update Deploy Button State
function updateDeployButtonState() {
  const deployBtn = document.getElementById('deploy-btn');
  const repoUrl = document.getElementById('repo-url').value.trim();
  
  if (selectedGoldenPath && repoUrl && selectedGoldenPath.status === 'functional') {
    deployBtn.disabled = false;
    deployBtn.innerHTML = '<span class="btn-icon">🚀</span>Deploy Golden Path';
  } else if (selectedGoldenPath && selectedGoldenPath.status === 'coming_soon') {
    deployBtn.disabled = true;
    deployBtn.innerHTML = '<span class="btn-icon">⏳</span>Coming Soon';
  } else {
    deployBtn.disabled = true;
    deployBtn.innerHTML = '<span class="btn-icon">🚀</span>Deploy Golden Path';
  }
}

// Main deployment function
async function deployGoldenPath() {
  if (!selectedGoldenPath) {
    alert('❌ Please select a Golden Path first.');
    return;
  }
  
  if (selectedGoldenPath.status === 'coming_soon') {
    alert('🚧 This Golden Path is coming soon! Please select Golden Path 1 for now.');
    return;
  }
  
  const repoUrl = document.getElementById('repo-url').value.trim();
  if (!repoUrl) {
    alert('❌ Please enter your application repository URL.');
    return;
  }
  
  if (!isValidRepoUrl(repoUrl)) {
    alert('❌ Please enter a valid GitHub repository URL.');
    return;
  }
  
  try {
    console.log('🚀 Starting Golden Path deployment...');
    
    // Get GitHub token
    const token = await getGitHubToken();
    if (!token) {
      return;
    }
    
    // Get configuration based on Golden Path
    const deploymentConfig = getDeploymentConfig();
    
    // Show deployment status
    document.getElementById('deployment-status').style.display = 'block';
    updateStatus('infra-status', 'Starting deployment...', 'running');
    updateStatus('app-status', 'Waiting for infrastructure...', 'pending');
    updateStatus('public-ip', 'Will be available in logs...', 'pending');
    
    // Disable deploy button
    const deployBtn = document.getElementById('deploy-btn');
    deployBtn.disabled = true;
    deployBtn.innerHTML = '<span class="btn-icon">⏳</span>Deploying...';
    
    // Trigger deployment workflow
    await triggerWorkflow(token, deploymentConfig);
    
  } catch (error) {
    console.error('❌ Deployment error:', error);
    handleDeploymentError(error);
  }
}

// Get deployment configuration
function getDeploymentConfig() {
  const config = {
    golden_path: selectedGoldenPath.id,
    repo_url: document.getElementById('repo-url').value.trim(),
    cleanup_after_deployment: document.getElementById('cleanup-after').checked.toString()
  };
  
  if (selectedGoldenPath.id === 'gp1') {
    config.instance_type = document.getElementById('instance-type').value;
    config.app_type = document.getElementById('app-type').value;
  }
  
  return config;
}

// Trigger GitHub workflow
async function triggerWorkflow(token, config) {
  const workflowFile = selectedGoldenPath.workflow_file;
  
  console.log('🔄 Triggering workflow:', workflowFile, 'with config:', config);
  
  const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/actions/workflows/${workflowFile}/dispatches`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ref: 'main',
      inputs: config
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to trigger workflow: ${response.status} - ${errorData.message || 'Unknown error'}`);
  }
  
  console.log('✅ Workflow triggered successfully');
  updateStatus('infra-status', 'Workflow triggered successfully', 'running');
  
  // Add workflow link
  addWorkflowLink();
  
  // Start monitoring
  setTimeout(() => monitorDeployment(), 5000);
  
  alert(`🚀 ${selectedGoldenPath.name} deployment started!

📋 Configuration:
• Repository: ${config.repo_url}
• Golden Path: ${selectedGoldenPath.name}
• Auto-cleanup: ${config.cleanup_after_deployment === 'true' ? 'Yes' : 'No'}

🔗 Monitor progress in real-time below.`);
}

// Get GitHub Personal Access Token
async function getGitHubToken() {
  let token = localStorage.getItem('github_token');
  
  if (!token) {
    const tokenInput = prompt(`🔐 GitHub Personal Access Token Required

Since you're using the hosted Golden Path platform, we need your GitHub token to trigger deployments in your repositories.

How to get a token:
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens
2. Generate new token with "workflow" and "repo" permissions
3. Copy and paste it below

Your token will be stored securely in your browser.

Enter your GitHub token:`);
    
    if (!tokenInput || tokenInput.trim() === '') {
      alert('❌ GitHub token is required for deployment.');
      return null;
    }
    
    token = tokenInput.trim();
    localStorage.setItem('github_token', token);
    console.log('✅ GitHub token stored locally');
  }
  
  return token;
}

// Monitor deployment progress
async function monitorDeployment() {
  const maxAttempts = 120;
  let attempts = 0;
  
  const checkStatus = async () => {
    try {
      const token = localStorage.getItem('github_token');
      if (!token) return;
      
      const workflowFile = selectedGoldenPath.workflow_file;
      const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/actions/workflows/${workflowFile}/runs?per_page=5`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) throw new Error(`Failed to fetch workflow runs: ${response.status}`);
      
      const data = await response.json();
      const runs = data.workflow_runs;
      
      if (runs && runs.length > 0) {
        const latestRun = runs[0];
        deploymentRunId = latestRun.id;
        
        console.log(`📊 Deployment status: ${latestRun.status} - ${latestRun.conclusion}`);
        updateDeploymentStatus(latestRun);
        updateWorkflowLink(latestRun.id);
        
        if (latestRun.status === 'completed') {
          clearInterval(pollingInterval);
          handleDeploymentCompletion(latestRun);
          return;
        }
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(pollingInterval);
        updateStatus('infra-status', 'Timeout', 'error');
        updateStatus('app-status', 'Timeout', 'error');
        alert("⏰ Deployment monitoring timed out. Please check GitHub Actions manually.");
        resetDeployButton();
      }
    } catch (error) {
      console.error("❌ Error monitoring deployment:", error);
      attempts++;
      if (attempts >= 5) {
        clearInterval(pollingInterval);
        updateStatus('infra-status', 'Monitoring error', 'error');
        resetDeployButton();
      }
    }
  };
  
  checkStatus();
  pollingInterval = setInterval(checkStatus, 30000);
}

// Handle deployment completion
function handleDeploymentCompletion(run) {
  if (run.conclusion === 'success') {
    updateStatus('app-status', 'Complete ✅', 'success');
    updateStatus('public-ip', 'Check Workflow Logs ➡️', 'success');
    resetDeployButton('Deploy Another Golden Path');
    
    alert(`🎉 ${selectedGoldenPath.name} deployed successfully!

🔗 View details: https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/actions/runs/${run.id}

🌐 Your application is now running! Check the workflow logs for the access URL.`);
  } else {
    updateStatus('infra-status', `Failed: ${run.conclusion}`, 'error');
    updateStatus('app-status', 'Failed', 'error');
    resetDeployButton('Retry Deployment');
    
    alert(`❌ Deployment failed!

🔗 Check logs: https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/actions/runs/${run.id}

Common issues:
• AWS credentials not configured in repository secrets
• Invalid repository URL or access permissions
• Application build/start errors`);
  }
}

// Update deployment status
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

// Add workflow link
function addWorkflowLink() {
  let linkElement = document.getElementById('workflow-link');
  if (!linkElement) {
    const statusSection = document.getElementById('deployment-status');
    const linkDiv = document.createElement('div');
    linkDiv.className = 'status-item';
    linkDiv.innerHTML = `
      <span class="status-label">Workflow:</span>
      <a id="workflow-link" href="https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/actions" target="_blank" class="repo-link">View Workflow Logs ➡️</a>
    `;
    statusSection.appendChild(linkDiv);
  }
}

// Update workflow link
function updateWorkflowLink(runId) {
  const linkElement = document.getElementById('workflow-link');
  if (linkElement && runId) {
    linkElement.href = `https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/actions/runs/${runId}`;
    linkElement.textContent = 'View Workflow Logs ➡️';
  }
}

// Handle deployment error
function handleDeploymentError(error) {
  resetDeployButton();
  updateStatus('infra-status', 'Failed to start', 'error');
  updateStatus('app-status', 'Failed', 'error');
  
  let errorMessage = '❌ Failed to start deployment!\n\n';
  
  if (error.message.includes('404')) {
    errorMessage += 'Workflow file not found. Please ensure the Golden Path workflow is set up in your repository.';
  } else if (error.message.includes('403')) {
    errorMessage += 'Permission denied. Please check your GitHub token permissions.';
  } else {
    errorMessage += `Error: ${error.message}`;
  }
  
  alert(errorMessage);
}

// Reset deploy button
function resetDeployButton(text = 'Deploy Golden Path') {
  const deployBtn = document.getElementById('deploy-btn');
  deployBtn.disabled = false;
  deployBtn.innerHTML = `<span class="btn-icon">🚀</span>${text}`;
}

// Validate repository URL
function isValidRepoUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'github.com' && urlObj.pathname.split('/').length >= 3;
  } catch {
    return false;
  }
}

// Update status display
function updateStatus(elementId, text, type) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
    element.className = `status-value ${type}`;
  }
}

// Clear stored tokens
function clearGitHubToken() {
  localStorage.removeItem('github_token');
  alert("🔐 GitHub token cleared. You'll be prompted for a new one on next deployment.");
}

// Event handlers
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Golden Path Deployment Platform initialized');
  console.log(`📍 Auto-detected repository: ${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`);
  
  // Load Golden Paths
  loadGoldenPaths();
  
  // Add event listeners
  document.getElementById('repo-url').addEventListener('input', updateDeployButtonState);
  
  // Check for stored token
  const token = localStorage.getItem('github_token');
  if (token) {
    console.log('✅ GitHub token found in local storage');
  } else {
    console.log('🔐 No GitHub token found - user will be prompted during deployment');
  }
});

// Export functions for global access
window.deployGoldenPath = deployGoldenPath;
window.clearGitHubToken = clearGitHubToken;
