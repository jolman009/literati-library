@echo off
echo ========================================
echo   Extract SHA256 Fingerprint
echo ========================================
echo.
echo This will extract the SHA256 fingerprint from your keystore.
echo You'll need to enter your keystore password.
echo.

set KEYTOOL="C:\Program Files\JetBrains\WebStorm 2025.1\jbr\bin\keytool.exe"
set KEYSTORE=shelfquest-release.keystore
set ALIAS=shelfquest_key

echo Running keytool to extract fingerprint...
echo.

%KEYTOOL% -list -v -keystore %KEYSTORE% -alias %ALIAS% > keystore_output.txt 2>&1

echo.
echo Looking for SHA256 fingerprint...
echo.

findstr /C:"SHA256:" keystore_output.txt

echo.
echo Full keystore info saved to: keystore_output.txt
echo.
echo Copy the SHA256 value (the part after "SHA256:")
echo It should look like: XX:XX:XX:XX:XX:...
echo.
pause
