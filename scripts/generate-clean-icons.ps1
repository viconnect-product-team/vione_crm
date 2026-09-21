Add-Type -AssemblyName System.Drawing

$sourcePath = (Resolve-Path "apps/vione_app_fe/public/ceo1983-emblem-8.png").Path
if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found: $sourcePath"
    exit 1
}

$srcImg = [System.Drawing.Bitmap]::FromFile($sourcePath)

$resDir = (Resolve-Path "apps/mobile_ceo1983/android/app/src/main/res").Path

# Specs: [folderName, foregroundSize, legacyIconSize]
$densities = @(
    @{ Folder = "mipmap-mdpi";    FgSize = 108; IconSize = 48 },
    @{ Folder = "mipmap-hdpi";    FgSize = 162; IconSize = 72 },
    @{ Folder = "mipmap-xhdpi";   FgSize = 216; IconSize = 96 },
    @{ Folder = "mipmap-xxhdpi";  FgSize = 324; IconSize = 144 },
    @{ Folder = "mipmap-xxxhdpi"; FgSize = 432; IconSize = 192 }
)

foreach ($d in $densities) {
    $folderPath = Join-Path $resDir $d.Folder
    if (-not (Test-Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
    }

    # 1. Generate ic_launcher_foreground.png (Transparent canvas, logo scaled to 58% of canvas, perfectly centered)
    $fgCanvas = New-Object System.Drawing.Bitmap($d.FgSize, $d.FgSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gFg = [System.Drawing.Graphics]::FromImage($fgCanvas)
    $gFg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gFg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gFg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gFg.Clear([System.Drawing.Color]::Transparent)

    $logoFgSize = [int]($d.FgSize * 0.58)
    $offsetFg = [int](($d.FgSize - $logoFgSize) / 2)
    $destRectFg = New-Object System.Drawing.Rectangle($offsetFg, $offsetFg, $logoFgSize, $logoFgSize)
    $gFg.DrawImage($srcImg, $destRectFg)
    $gFg.Dispose()

    $fgOutPath = Join-Path $folderPath "ic_launcher_foreground.png"
    $fgCanvas.Save($fgOutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $fgCanvas.Dispose()
    Write-Host "Created $fgOutPath ($($d.FgSize)x$($d.FgSize), logo $logoFgSize px)" -ForegroundColor Green

    # 2. Generate ic_launcher.png (Legacy square/squircle icon: white background with rounded corners, centered logo)
    $iconCanvas = New-Object System.Drawing.Bitmap($d.IconSize, $d.IconSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gIcon = [System.Drawing.Graphics]::FromImage($iconCanvas)
    $gIcon.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gIcon.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gIcon.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gIcon.Clear([System.Drawing.Color]::Transparent)

    # White squircle/rounded rectangle plate
    $brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $cornerRadius = [int]($d.IconSize * 0.22)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $rect = New-Object System.Drawing.Rectangle(0, 0, $d.IconSize, $d.IconSize)
    $d2 = $cornerRadius * 2
    $path.AddArc(0, 0, $d2, $d2, 180, 90)
    $path.AddArc($d.IconSize - $d2, 0, $d2, $d2, 270, 90)
    $path.AddArc($d.IconSize - $d2, $d.IconSize - $d2, $d2, $d2, 0, 90)
    $path.AddArc(0, $d.IconSize - $d2, $d2, $d2, 90, 90)
    $path.CloseFigure()
    $gIcon.FillPath($brushWhite, $path)

    $logoIconSize = [int]($d.IconSize * 0.68)
    $offsetIcon = [int](($d.IconSize - $logoIconSize) / 2)
    $destRectIcon = New-Object System.Drawing.Rectangle($offsetIcon, $offsetIcon, $logoIconSize, $logoIconSize)
    $gIcon.DrawImage($srcImg, $destRectIcon)
    $gIcon.Dispose()
    $brushWhite.Dispose()
    $path.Dispose()

    $iconOutPath = Join-Path $folderPath "ic_launcher.png"
    $iconCanvas.Save($iconOutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $iconCanvas.Dispose()
    Write-Host "Created $iconOutPath ($($d.IconSize)x$($d.IconSize))" -ForegroundColor Cyan

    # 3. Generate ic_launcher_round.png (Circular white plate, centered logo)
    $roundCanvas = New-Object System.Drawing.Bitmap($d.IconSize, $d.IconSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gRound = [System.Drawing.Graphics]::FromImage($roundCanvas)
    $gRound.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gRound.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gRound.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gRound.Clear([System.Drawing.Color]::Transparent)

    $brushWhiteRound = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $gRound.FillEllipse($brushWhiteRound, 0, 0, $d.IconSize, $d.IconSize)

    $logoRoundSize = [int]($d.IconSize * 0.65)
    $offsetRound = [int](($d.IconSize - $logoRoundSize) / 2)
    $destRectRound = New-Object System.Drawing.Rectangle($offsetRound, $offsetRound, $logoRoundSize, $logoRoundSize)
    $gRound.DrawImage($srcImg, $destRectRound)
    $gRound.Dispose()
    $brushWhiteRound.Dispose()

    $roundOutPath = Join-Path $folderPath "ic_launcher_round.png"
    $roundCanvas.Save($roundOutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $roundCanvas.Dispose()
    Write-Host "Created $roundOutPath ($($d.IconSize)x$($d.IconSize))" -ForegroundColor Blue
}

$srcImg.Dispose()
Write-Host "`nSuccessfully generated all neat icons with 20% safe margin!" -ForegroundColor Green
