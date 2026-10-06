Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("release_apk/ViOne-PWA-latest.apk")
foreach ($entry in $zip.Entries) {
    if ($entry.FullName -like "*capacitor*" -or $entry.FullName -like "*index.html*") {
        Write-Host "=== FILE: " $entry.FullName
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $text = $reader.ReadToEnd()
        Write-Host $text.Substring(0, [Math]::Min(500, $text.Length))
        $reader.Close()
        $stream.Close()
    }
}
$zip.Dispose()
