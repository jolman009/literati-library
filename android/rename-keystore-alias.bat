@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Helper to rename a keystore alias using keytool in a persistent console
REM Defaults for this project
set "KEYSTORE=android\shelfquest-release.keystore"
set "ALIAS_OLD=literati_key"
set "ALIAS_NEW=shelfquest_key"
set "STORETYPE=pkcs12"

REM Try to locate keytool from Android Studio JBR
set "KEYTOOL="
if exist "C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\keytool.exe" set "KEYTOOL=C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\keytool.exe"
if not defined KEYTOOL if exist "%ProgramFiles%\\Android\\Android Studio\\jbr\\bin\\keytool.exe" set "KEYTOOL=%ProgramFiles%\\Android\\Android Studio\\jbr\\bin\\keytool.exe"

REM Fallback to JAVA_HOME
if not defined KEYTOOL if defined JAVA_HOME if exist "%JAVA_HOME%\\bin\\keytool.exe" set "KEYTOOL=%JAVA_HOME%\\bin\\keytool.exe"

if not defined KEYTOOL (
  echo [ERROR] Could not find keytool.exe. Install Android Studio or set JAVA_HOME.
  echo         Expected at: ^"C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\keytool.exe^" or %%JAVA_HOME%%\bin\keytool.exe
  pause
  exit /b 1
)

echo Using keytool: "%KEYTOOL%"
echo Keystore: %KEYSTORE%
echo Renaming alias: %ALIAS_OLD%  ^>  %ALIAS_NEW%
echo.

if not exist "%KEYSTORE%" (
  echo [ERROR] Keystore not found: "%KEYSTORE%"
  pause
  exit /b 1
)

REM Attempt rename with PKCS12 first (default on modern keytool)
"%KEYTOOL%" -changealias -storetype %STORETYPE% -keystore "%KEYSTORE%" -alias "%ALIAS_OLD%" -destalias "%ALIAS_NEW%"
if errorlevel 1 (
  echo.
  echo [WARN] Rename with storetype=%STORETYPE% failed. Trying storetype=jks ...
  "%KEYTOOL%" -changealias -storetype jks -keystore "%KEYSTORE%" -alias "%ALIAS_OLD%" -destalias "%ALIAS_NEW%"
)

echo.
echo Verifying alias and fingerprint...
"%KEYTOOL%" -list -v -keystore "%KEYSTORE%" -alias "%ALIAS_NEW%"

echo.
echo [DONE] If the command above shows Alias name: %ALIAS_NEW%, the rename succeeded.
echo The SHA-256 fingerprint should remain unchanged.
pause

