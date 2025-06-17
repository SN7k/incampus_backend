# PowerShell script to update the GitHub repository

# Navigate to the backend directory
Set-Location -Path "D:\SHOMBHU\Desktop\incampus\backend"

# Initialize git if not already initialized
if (-not (Test-Path -Path ".git")) {
    Write-Host "Initializing git repository..."
    git init
}

# Configure git to use the correct remote
$remoteExists = git remote -v | Select-String -Pattern "origin"
if (-not $remoteExists) {
    Write-Host "Adding remote repository..."
    git remote add origin https://github.com/SN7k/incampus_backend.git
}

# Add all files to git
Write-Host "Adding files to git..."
git add .

# Commit changes
Write-Host "Committing changes..."
git commit -m "Update backend to support enhanced notification and post features"

# Push to GitHub
Write-Host "Pushing to GitHub..."
git push -u origin master

Write-Host "Done! Backend code has been pushed to GitHub."

# Notify about live deployment
Write-Host "Backend is live at https://incampus-backend.onrender.com"
