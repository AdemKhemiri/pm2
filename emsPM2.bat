TIMEOUT 5
taskkill /f /im node.exe
TIMEOUT 5
cd C:\EMS
pm2 start .\data-reading.js
cmd /k
