#!/usr/bin/env pwsh
#
# License Header Script for CodeQuest
# Adds proprietary license header to all source files
#

# Define the license header
$licenseHeader = @"
/**
 * CodeQuest - VS Code LeetCode Progress Tracker
 * 
 * Copyright (c) 2025 tayyab3245. All rights reserved.
 * 
 * This software is proprietary and confidential. Unauthorized reproduction,
 * distribution, or modification is strictly prohibited. See LICENSE file
 * for full terms and conditions.
 * 
 * @author tayyab3245
 * @license Proprietary
 */

"@

# File extensions to process
$extensions = @('*.ts', '*.js', '*.tsx', '*.jsx', '*.vue', '*.svelte')

# Directories to skip
$skipDirs = @('node_modules', 'dist', 'out', '.git', '.vscode', 'coverage')

# Files to skip (exact matches)
$skipFiles = @('package.json', 'package-lock.json', 'tsconfig.json', '.gitignore', 'LICENSE', 'README.md', 'CHANGELOG.md', '*.md', '*.json', '*.yml', '*.yaml')

Write-Host "Adding license headers to CodeQuest source files..." -ForegroundColor Cyan

$processedCount = 0
$skippedCount = 0
$alreadyHasLicense = 0

function Test-HasLicenseHeader {
    param($filePath)
    
    $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
    if (-not $content) { return $false }
    
    # Check if file already has copyright notice
    return $content -match "Copyright.*tayyab3245" -or $content -match "@license Proprietary"
}

function Add-LicenseHeader {
    param($file)
    
    if (Test-HasLicenseHeader $file.FullName) {
        Write-Host "   Already has license: $($file.Name)" -ForegroundColor Yellow
        return $false
    }
    
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        $newContent = $licenseHeader + $content
        Set-Content $file.FullName $newContent -NoNewline -ErrorAction Stop
        Write-Host "   Added header: $($file.Name)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "   Failed: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Get all files matching extensions
foreach ($ext in $extensions) {
    Write-Host "`nProcessing $ext files..." -ForegroundColor Blue
    
    $files = Get-ChildItem -Path . -Filter $ext -Recurse | Where-Object {
        # Skip directories in skipDirs
        $relativePath = $_.FullName.Replace((Get-Location).Path, '')
        $shouldSkip = $false
        
        foreach ($skipDir in $skipDirs) {
            if ($relativePath -like "*$skipDir*") {
                $shouldSkip = $true
                break
            }
        }
        
        # Skip specific files
        foreach ($skipFile in $skipFiles) {
            if ($_.Name -like $skipFile) {
                $shouldSkip = $true
                break
            }
        }
        
        return -not $shouldSkip
    }
    
    foreach ($file in $files) {
        if (Add-LicenseHeader $file) {
            $processedCount++
        } else {
            if (Test-HasLicenseHeader $file) {
                $alreadyHasLicense++
            } else {
                $skippedCount++
            }
        }
    }
}

Write-Host "`nSummary:" -ForegroundColor Magenta
Write-Host "   Files processed: $processedCount" -ForegroundColor Green
Write-Host "   Already licensed: $alreadyHasLicense" -ForegroundColor Yellow
Write-Host "   Skipped: $skippedCount" -ForegroundColor Gray

if ($processedCount -gt 0) {
    Write-Host "`nLicense headers added successfully!" -ForegroundColor Green
    Write-Host "Remember to review the changes before committing." -ForegroundColor Cyan
} else {
    Write-Host "`nNo files needed license headers." -ForegroundColor Yellow
}
