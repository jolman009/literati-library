@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "C:\Users\Jolma\Vibe-Code\my-library-app-2\android"
echo Current directory: %CD%
dir gradlew.bat
echo.
echo Running gradlew...
"%CD%\gradlew.bat" assembleDebug --stacktrace
