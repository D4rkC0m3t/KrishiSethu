# Firebase Storage CORS Setup - Prerequisites Checker
Write-Host "🔧 Checking Firebase Storage CORS Setup Prerequisites..." -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check if gcloud is installed
Write-Host "1. Checking Google Cloud CLI..." -ForegroundColor Yellow
try {
    $gcloudVersion = gcloud --version 2>$null
    if ($gcloudVersion) {
        Write-Host "   ✅ Google Cloud CLI found" -ForegroundColor Green
        Write-Host "   📋 Version: $($gcloudVersion[0])" -ForegroundColor Gray
    } else {
        throw "Not found"
    }
} catch {
    Write-Host "   ❌ Google Cloud CLI not found" -ForegroundColor Red
    Write-Host "   💡 Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    $allGood = $false
}

# Check if gsutil is available
Write-Host ""
Write-Host "2. Checking gsutil..." -ForegroundColor Yellow
try {
    $gsutilVersion = gsutil --version 2>$null
    if ($gsutilVersion) {
        Write-Host "   ✅ gsutil found" -ForegroundColor Green
        Write-Host "   📋 Version: $($gsutilVersion[0])" -ForegroundColor Gray
    } else {
        throw "Not found"
    }
} catch {
    Write-Host "   ❌ gsutil not found" -ForegroundColor Red
    Write-Host "   💡 Install Google Cloud SDK to get gsutil" -ForegroundColor Yellow
    $allGood = $false
}

# Check if Firebase CLI is installed
Write-Host ""
Write-Host "3. Checking Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version 2>$null
    if ($firebaseVersion) {
        Write-Host "   ✅ Firebase CLI found" -ForegroundColor Green
        Write-Host "   📋 Version: $firebaseVersion" -ForegroundColor Gray
    } else {
        throw "Not found"
    }
} catch {
    Write-Host "   ⚠️ Firebase CLI not found" -ForegroundColor Yellow
    Write-Host "   💡 Install with: npm install -g firebase-tools" -ForegroundColor Yellow
    Write-Host "   📝 This is optional but recommended" -ForegroundColor Gray
}

# Check authentication status
Write-Host ""
Write-Host "4. Checking Google Cloud authentication..." -ForegroundColor Yellow
try {
    $authList = gcloud auth list --format="value(account)" 2>$null
    if ($authList) {
        Write-Host "   ✅ Authenticated accounts found:" -ForegroundColor Green
        $authList | ForEach-Object { Write-Host "   📧 $_" -ForegroundColor Gray }
    } else {
        throw "No accounts"
    }
} catch {
    Write-Host "   ⚠️ No authenticated accounts found" -ForegroundColor Yellow
    Write-Host "   💡 Run: gcloud auth login" -ForegroundColor Yellow
}

# Check current project
Write-Host ""
Write-Host "5. Checking current Google Cloud project..." -ForegroundColor Yellow
try {
    $currentProject = gcloud config get-value project 2>$null
    if ($currentProject -eq "krishisetu-88b88") {
        Write-Host "   ✅ Correct project set: $currentProject" -ForegroundColor Green
    } elseif ($currentProject) {
        Write-Host "   ⚠️ Different project set: $currentProject" -ForegroundColor Yellow
        Write-Host "   💡 Run: gcloud config set project krishisetu-88b88" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠️ No project set" -ForegroundColor Yellow
        Write-Host "   💡 Run: gcloud config set project krishisetu-88b88" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Could not check project" -ForegroundColor Red
}

# Check if CORS file exists
Write-Host ""
Write-Host "6. Checking CORS configuration file..." -ForegroundColor Yellow
if (Test-Path "cors.json") {
    Write-Host "   ✅ cors.json file found" -ForegroundColor Green
    $corsContent = Get-Content "cors.json" -Raw | ConvertFrom-Json
    $originCount = $corsContent[0].origin.Count
    Write-Host "   📋 Origins configured: $originCount" -ForegroundColor Gray
} else {
    Write-Host "   ❌ cors.json file not found" -ForegroundColor Red
    Write-Host "   💡 The file should be in the current directory" -ForegroundColor Yellow
    $allGood = $false
}

# Summary
Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
if ($allGood) {
    Write-Host "🎉 All prerequisites met! You can proceed with CORS setup." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Run: gcloud auth login (if not authenticated)" -ForegroundColor White
    Write-Host "2. Run: gcloud config set project krishisetu-88b88" -ForegroundColor White
    Write-Host "3. Run: gsutil cors set cors.json gs://krishisetu-88b88.firebasestorage.app" -ForegroundColor White
    Write-Host "4. Verify: gsutil cors get gs://krishisetu-88b88.firebasestorage.app" -ForegroundColor White
} else {
    Write-Host "⚠️ Some prerequisites are missing. Please install them first." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Installation links:" -ForegroundColor Yellow
    Write-Host "• Google Cloud SDK: https://cloud.google.com/sdk/docs/install" -ForegroundColor White
    Write-Host "• Firebase CLI: npm install -g firebase-tools" -ForegroundColor White
}

Write-Host ""
Write-Host "🔗 For detailed setup instructions, see: setup-firebase-cors.md" -ForegroundColor Cyan
Write-Host ""

# Keep window open
Read-Host "Press Enter to continue..."
