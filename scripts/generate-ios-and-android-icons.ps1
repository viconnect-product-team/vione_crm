Add-Type -AssemblyName System.Drawing

$sourcePath = (Resolve-Path "apps/vione_app_fe/public/ceo1983-emblem-8.png").Path
if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found: $sourcePath"
    exit 1
}

$srcImg = [System.Drawing.Bitmap]::FromFile($sourcePath)
Write-Host "Loaded source emblem from: $sourcePath ($($srcImg.Width)x$($srcImg.Height))" -ForegroundColor Cyan

# ==============================================================================
# 1. GENERATE ANDROID MIPMAP ICONS (apps/mobile_ceo1983/android/app/src/main/res)
# ==============================================================================
$resDir = (Resolve-Path "apps/mobile_ceo1983/android/app/src/main/res").Path
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

    # 1.1 ic_launcher_foreground.png (Transparent background, centered logo)
    $fgCanvas = New-Object System.Drawing.Bitmap($d.FgSize, $d.FgSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gFg = [System.Drawing.Graphics]::FromImage($fgCanvas)
    $gFg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gFg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gFg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gFg.Clear([System.Drawing.Color]::Transparent)

    $logoFgSize = [int]($d.FgSize * 0.60)
    $offsetFg = [int](($d.FgSize - $logoFgSize) / 2)
    $destRectFg = New-Object System.Drawing.Rectangle($offsetFg, $offsetFg, $logoFgSize, $logoFgSize)
    $gFg.DrawImage($srcImg, $destRectFg)
    $gFg.Dispose()

    $fgOutPath = Join-Path $folderPath "ic_launcher_foreground.png"
    $fgCanvas.Save($fgOutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $fgCanvas.Dispose()

    # 1.2 ic_launcher.png (Squircle plate: white background, rounded corners)
    $iconCanvas = New-Object System.Drawing.Bitmap($d.IconSize, $d.IconSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gIcon = [System.Drawing.Graphics]::FromImage($iconCanvas)
    $gIcon.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gIcon.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gIcon.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gIcon.Clear([System.Drawing.Color]::Transparent)

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

    $logoIconSize = [int]($d.IconSize * 0.70)
    $offsetIcon = [int](($d.IconSize - $logoIconSize) / 2)
    $destRectIcon = New-Object System.Drawing.Rectangle($offsetIcon, $offsetIcon, $logoIconSize, $logoIconSize)
    $gIcon.DrawImage($srcImg, $destRectIcon)
    $gIcon.Dispose()
    $brushWhite.Dispose()
    $path.Dispose()

    $iconOutPath = Join-Path $folderPath "ic_launcher.png"
    $iconCanvas.Save($iconOutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $iconCanvas.Dispose()

    # 1.3 ic_launcher_round.png (Circular white plate, centered logo)
    $roundCanvas = New-Object System.Drawing.Bitmap($d.IconSize, $d.IconSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gRound = [System.Drawing.Graphics]::FromImage($roundCanvas)
    $gRound.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gRound.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gRound.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gRound.Clear([System.Drawing.Color]::Transparent)

    $brushWhiteRound = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $gRound.FillEllipse($brushWhiteRound, 0, 0, $d.IconSize, $d.IconSize)

    $logoRoundSize = [int]($d.IconSize * 0.68)
    $offsetRound = [int](($d.IconSize - $logoRoundSize) / 2)
    $destRectRound = New-Object System.Drawing.Rectangle($offsetRound, $offsetRound, $logoRoundSize, $logoRoundSize)
    $gRound.DrawImage($srcImg, $destRectRound)
    $gRound.Dispose()
    $brushWhiteRound.Dispose()

    $roundOutPath = Join-Path $folderPath "ic_launcher_round.png"
    $roundCanvas.Save($roundOutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $roundCanvas.Dispose()
    Write-Host "Generated Android icons for $($d.Folder)" -ForegroundColor Green
}

# ==============================================================================
# 2. GENERATE IOS APPICON (1024x1024 - Universal iOS App Store standard)
# ==============================================================================
# Apple requires: Exactly 1024x1024 px, Solid background (No alpha/transparency), Square (iOS will mask corners)
$ios1024Canvas = New-Object System.Drawing.Bitmap(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppRgb)
$gIos = [System.Drawing.Graphics]::FromImage($ios1024Canvas)
$gIos.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gIos.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gIos.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
# Clean white background matching the Android plate
$gIos.Clear([System.Drawing.Color]::White)

# Draw emblem centered with 72% size (Apple safe area recommendation: ~70-75%)
$iosLogoSize = [int](1024 * 0.72)
$iosOffset = [int]((1024 - $iosLogoSize) / 2)
$destRectIos = New-Object System.Drawing.Rectangle($iosOffset, $iosOffset, $iosLogoSize, $iosLogoSize)
$gIos.DrawImage($srcImg, $destRectIos)
$gIos.Dispose()

# Save to iOS Asset Catalogs
$iosTargets = @(
    "apps/mobile_ceo1983/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
    "apps/mobile_ceo1983/ios/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
)

foreach ($targetRel in $iosTargets) {
    $targetPath = Join-Path (Get-Location) $targetRel
    $targetDir = Split-Path -Parent $targetPath
    if (Test-Path $targetDir) {
        $ios1024Canvas.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Generated iOS AppIcon: $targetRel (1024x1024)" -ForegroundColor Green
    }
}

# ==============================================================================
# 3. GENERATE EXPO ASSETS (apps/mobile_ceo1983/assets)
# ==============================================================================
$expoAssetDir = Join-Path (Get-Location) "apps/mobile_ceo1983/assets"
if (Test-Path $expoAssetDir) {
    # 3.1 icon.png (1024x1024 for Expo & iOS)
    $expoIconPath = Join-Path $expoAssetDir "icon.png"
    $ios1024Canvas.Save($expoIconPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Generated Expo Icon: $expoIconPath" -ForegroundColor Green

    # 3.2 adaptive-icon.png (1024x1024 for Expo Android)
    $expoAdaptivePath = Join-Path $expoAssetDir "adaptive-icon.png"
    $ios1024Canvas.Save($expoAdaptivePath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Generated Expo Adaptive Icon: $expoAdaptivePath" -ForegroundColor Green

    # 3.3 favicon.png (48x48)
    $favCanvas = New-Object System.Drawing.Bitmap(48, 48, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gFav = [System.Drawing.Graphics]::FromImage($favCanvas)
    $gFav.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gFav.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gFav.Clear([System.Drawing.Color]::Transparent)
    $destRectFav = New-Object System.Drawing.Rectangle(0, 0, 48, 48)
    $gFav.DrawImage($srcImg, $destRectFav)
    $gFav.Dispose()
    $favPath = Join-Path $expoAssetDir "favicon.png"
    $favCanvas.Save($favPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $favCanvas.Dispose()
    Write-Host "Generated Favicon: $favPath" -ForegroundColor Green
}

$ios1024Canvas.Dispose()
$srcImg.Dispose()

Write-Host "`nSUCCESS: All iOS and Android App Icons perfectly synchronized with CEO 1983 Emblem!" -ForegroundColor Cyan
