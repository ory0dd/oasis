$supabaseUrl = "https://mxxasrhqwzpbcuzglzif.supabase.co"
$supabaseKey = "sb_publishable_ol0sZk1O3ClTMECU5yRgPw_YlbDN8Mm"
$bucket = "oasis-media"

# Try to create bucket
$headers = @{
    "Authorization" = "Bearer $supabaseKey"
    "apikey" = $supabaseKey
    "Content-Type" = "application/json"
}

$body = @{
    id = $bucket
    name = $bucket
    public = $true
} | ConvertTo-Json

try {
    Write-Host "Creating bucket..."
    $res = Invoke-RestMethod -Uri "$supabaseUrl/storage/v1/bucket" -Method Post -Headers $headers -Body $body
    Write-Host "Bucket created successfully: $res"
} catch {
    Write-Host "Could not create bucket (it might already exist): $_"
}

# Try uploading a small test file
$testFile = "test_upload.txt"
"Hello Supabase" | Out-File -FilePath $testFile -Encoding utf8

$uploadHeaders = @{
    "Authorization" = "Bearer $supabaseKey"
    "apikey" = $supabaseKey
}

try {
    Write-Host "Uploading test file..."
    $res = Invoke-RestMethod -Uri "$supabaseUrl/storage/v1/object/$bucket/$testFile" -Method Post -Headers $uploadHeaders -InFile $testFile -ContentType "text/plain"
    Write-Host "Upload successful! Response: $res"
    Remove-Item -Path $testFile
} catch {
    Write-Host "Upload failed: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        Write-Host "Error Body: $errBody"
    }
}
