Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory('C:\Users\Peter\Desktop\PARLAYZ\parlayz.zip', 'C:\Users\Peter\Desktop\PARLAYZ\temp_parlayz')
Write-Host "Done"
