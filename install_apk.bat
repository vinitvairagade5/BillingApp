@echo off
echo Waiting for emulator to be ready...
"C:\Users\v7620\AppData\Local\Android\Sdk\platform-tools\adb.exe" wait-for-device
echo Emulator connected! Installing App...
"C:\Users\v7620\AppData\Local\Android\Sdk\platform-tools\adb.exe" install -r "d:/000 Know your Income MAX LIMIT/06Workspace/AntigravityProjects/BillingApp/src/billing-app-ui/android/app/build/outputs/apk/debug/app-debug.apk"
echo.
echo App Installed Successfully! Check the emulator menu for "BillPro".
pause
