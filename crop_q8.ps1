Add-Type -AssemblyName System.Drawing

function AutoCrop-WhiteBackground {
    param (
        [string]$SourcePath,
        [string]$DestPath,
        [int]$Threshold = 250,
        [int]$Padding = 10,
        [float]$MinYPct = 0.0,
        [float]$MaxYPct = 1.0,
        [float]$MinXPct = 0.0,
        [float]$MaxXPct = 1.0
    )
    
    $srcImg = New-Object System.Drawing.Bitmap($SourcePath)
    $width = $srcImg.Width
    $height = $srcImg.Height
    
    $scanMinY = [int]($height * $MinYPct)
    $scanMaxY = [int]($height * $MaxYPct)
    $scanMinX = [int]($width * $MinXPct)
    $scanMaxX = [int]($width * $MaxXPct)
    
    $minX = $scanMaxX
    $maxX = $scanMinX
    $minY = $scanMaxY
    $maxY = $scanMinY
    
    for ($y = $scanMinY; $y -lt $scanMaxY; $y++) {
        for ($x = $scanMinX; $x -lt $scanMaxX; $x++) {
            $pixel = $srcImg.GetPixel($x, $y)
            if ($pixel.R -lt $Threshold -or $pixel.G -lt $Threshold -or $pixel.B -lt $Threshold) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    
    $minX = [Math]::Max(0, $minX - $Padding)
    $maxX = [Math]::Min($width - 1, $maxX + $Padding)
    $minY = [Math]::Max(0, $minY - $Padding)
    $maxY = [Math]::Min($height - 1, $maxY + $Padding)
    
    $cropWidth = $maxX - $minX + 1
    $cropHeight = $maxY - $minY + 1
    
    Write-Output "Content Bounding Box for $($SourcePath) - X=$minX, Y=$minY, Width=$cropWidth, Height=$cropHeight"
    
    if ($cropWidth -gt 0 -and $cropHeight -gt 0) {
        $bmp = New-Object System.Drawing.Bitmap($cropWidth, $cropHeight)
        $graphics = [System.Drawing.Graphics]::FromImage($bmp)
        
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        
        $srcRect = New-Object System.Drawing.Rectangle($minX, $minY, $cropWidth, $cropHeight)
        $destRect = New-Object System.Drawing.Rectangle(0, 0, $cropWidth, $cropHeight)
        
        $graphics.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        
        $bmp.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $graphics.Dispose()
        $bmp.Dispose()
        Write-Output "Saved cropped image to $DestPath"
    } else {
        Write-Output "Error: No content detected in image!"
    }
    
    $srcImg.Dispose()
}

# Crop Q8
$q8_src = "C:\Users\Administrador\.gemini\antigravity\brain\45c5fb9f-095d-4ece-bc53-8338ed1c5522\media__1779413739186.png"
$q8_dest = "c:\Users\Administrador\Downloads\oasis\oasis\frontend\public\icar16\q8.png"
AutoCrop-WhiteBackground -SourcePath $q8_src -DestPath $q8_dest -MinYPct 0.0 -MaxYPct 1.0 -MinXPct 0.0 -MaxXPct 1.0
