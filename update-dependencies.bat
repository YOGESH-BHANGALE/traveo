@echo off
REM Traveo - Dependency Update Script for Windows
REM This script safely updates dependencies with testing

echo ========================================
echo Traveo Dependency Update Script
echo ========================================
echo.

REM Create backup branch
echo Creating backup branch...
git checkout -b dependency-updates-%date:~-4,4%%date:~-10,2%%date:~-7,2%
if %errorlevel% neq 0 (
    echo Failed to create backup branch
    exit /b 1
)
echo [OK] Backup branch created
echo.

REM Update Backend Dependencies
echo ========================================
echo Updating Backend Dependencies...
echo ========================================
cd server

echo Updating safe packages (bcryptjs, dotenv, helmet, uuid)...
call npm update bcryptjs dotenv helmet uuid
if %errorlevel% neq 0 (
    echo Failed to update packages
    exit /b 1
)
echo [OK] Safe packages updated

echo Running backend tests...
call npm test
if %errorlevel% neq 0 (
    echo Backend tests failed
    exit /b 1
)
echo [OK] Backend tests passed
echo.

REM Ask about Express update
set /p EXPRESS_UPDATE="Express 5 has breaking changes. Update Express to v5? (y/n): "
if /i "%EXPRESS_UPDATE%"=="y" (
    echo Updating Express to v5...
    call npm install express@5
    if %errorlevel% neq 0 (
        echo Failed to update Express
        exit /b 1
    )
    
    echo Running tests after Express update...
    call npm test
    if %errorlevel% neq 0 (
        echo Tests failed with Express 5, rolling back...
        call npm install express@4
        echo Express rolled back to v4
    ) else (
        echo [OK] Tests passed with Express 5
    )
)
echo.

REM Ask about Mongoose update
set /p MONGOOSE_UPDATE="Mongoose 9 has breaking changes. Update Mongoose to v9? (y/n): "
if /i "%MONGOOSE_UPDATE%"=="y" (
    echo Updating Mongoose to v9...
    call npm install mongoose@9
    if %errorlevel% neq 0 (
        echo Failed to update Mongoose
        exit /b 1
    )
    
    echo Running tests after Mongoose update...
    call npm test
    if %errorlevel% neq 0 (
        echo Tests failed with Mongoose 9, rolling back...
        call npm install mongoose@8
        echo Mongoose rolled back to v8
    ) else (
        echo [OK] Tests passed with Mongoose 9
    )
)
echo.

REM Update Frontend Dependencies
echo ========================================
echo Updating Frontend Dependencies...
echo ========================================
cd ..\client

echo Updating frontend packages...
call npm update
if %errorlevel% neq 0 (
    echo Failed to update frontend packages
    exit /b 1
)
echo [OK] Frontend packages updated

echo Running frontend tests...
call npm test
if %errorlevel% neq 0 (
    echo Frontend tests failed
    exit /b 1
)
echo [OK] Frontend tests passed

echo Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed
    exit /b 1
)
echo [OK] Frontend build successful
echo.

REM Summary
echo ========================================
echo [OK] Dependency updates completed!
echo ========================================
echo.
echo Next steps:
echo 1. Review changes: git diff
echo 2. Test the application manually
echo 3. Commit changes: git add . ^&^& git commit -m "Update dependencies"
echo 4. Merge to main: git checkout main ^&^& git merge dependency-updates-%date:~-4,4%%date:~-10,2%%date:~-7,2%
echo.
echo If something went wrong:
echo - Switch back: git checkout main
echo - Delete branch: git branch -D dependency-updates-%date:~-4,4%%date:~-10,2%%date:~-7,2%
echo.
pause
