@echo off
rem Build using an existing MSVC environment, or locate one via vswhere.
setlocal
if not exist "%~dp0overlay.cpp" (
  echo ERROR: overlay.cpp not found next to build.bat.
  exit /b 1
)
where cl.exe >nul 2>&1
if not errorlevel 1 goto build

set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
if not exist "%VSWHERE%" set "VSWHERE=%ProgramFiles%\Microsoft Visual Studio\Installer\vswhere.exe"
set "VSINST="
if exist "%VSWHERE%" for /f "usebackq delims=" %%i in (`"%VSWHERE%" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do set "VSINST=%%i"
if not defined VSINST (
  echo ERROR: MSVC C++ build tools not found.
  echo Install Visual Studio Build Tools with the Desktop development with C++ workload,
  echo including the Windows SDK, then run build.bat again.
  exit /b 1
)
echo Using Visual Studio: %VSINST%
call "%VSINST%\VC\Auxiliary\Build\vcvarsall.bat" x64
if errorlevel 1 (
  echo ERROR: Could not initialise the MSVC environment.
  exit /b 1
)

:build
cd /d "%~dp0"
cl /nologo /EHsc /MD /utf-8 /Fe:overlay.exe overlay.cpp /link /SUBSYSTEM:WINDOWS user32.lib gdi32.lib dwmapi.lib d2d1.lib dwrite.lib comctl32.lib shell32.lib winmm.lib
if errorlevel 1 (
  echo ERROR: Build failed.
  exit /b 1
)
echo OK: overlay.exe rebuilt successfully.
exit /b 0
