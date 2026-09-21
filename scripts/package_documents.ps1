$files = @(
  "document\TIEN_DO_CONG_VIEC_APP_HIEP_HOI_CHI_TIET.xlsx",
  "document\TIEN_DO_CONG_VIEC_APP_HIEP_HOI_CHI_TIET.md",
  "document\TEST_CASES_APP_HIEP_HOI_CHI_TIET.xlsx",
  "document\SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.pptx",
  "document\SLIDE_THUYET_TRINH_CRM_QUAN_TRI_CEO1983.html",
  "document\SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.pptx",
  "document\SLIDE_THUYET_TRINH_APP_HIEP_HOI_CEO1983.html",
  "document\HUONG_DAN_SU_DUNG_APP_HIEP_HOI.docx",
  "document\HUONG_DAN_SU_DUNG_APP_HIEP_HOI.pdf",
  "document\HUONG_DAN_SU_DUNG_APP_HIEP_HOI.md",
  "document\HUONG_DAN_SU_DUNG_CRM.docx",
  "document\HUONG_DAN_SU_DUNG_CRM.pdf",
  "document\HUONG_DAN_SU_DUNG_CRM.md"
)

$dest = "document\GOI_TAI_LIEU_CEO1983_CAP_NHAT.zip"
if (Test-Path $dest) { Remove-Item $dest -Force }

Write-Host "Zipping files into $dest..."
Compress-Archive -Path $files -DestinationPath $dest -Force
Write-Host "Done!"
Get-Item $dest | Select-Object Name, Length, LastWriteTime
