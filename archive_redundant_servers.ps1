# PowerShell script to archive redundant server implementations

# Create archive directory if it doesn't exist
$archiveDir = "./archived_servers"
if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir
    Write-Host "Created archive directory: $archiveDir"
}

# Get current date for archive naming
$date = Get-Date -Format "yyyy-MM-dd"

# Archive the nested server directory
if (Test-Path "./server/server") {
    $nestedServerArchive = "$archiveDir/nested_server_$date"
    New-Item -ItemType Directory -Path $nestedServerArchive
    Copy-Item -Path "./server/server/*" -Destination $nestedServerArchive -Recurse
    Write-Host "Archived nested server to: $nestedServerArchive"
}

# Archive the backend directory
if (Test-Path "./backend") {
    $backendArchive = "$archiveDir/backend_$date"
    New-Item -ItemType Directory -Path $backendArchive
    Copy-Item -Path "./backend/*" -Destination $backendArchive -Recurse
    Write-Host "Archived backend to: $backendArchive"
}

Write-Host "Archive process completed. The original directories have been preserved."
Write-Host "To remove the original directories after verifying the archives, run:"
Write-Host "Remove-Item -Path './server/server' -Recurse -Force"
Write-Host "Remove-Item -Path './backend' -Recurse -Force"