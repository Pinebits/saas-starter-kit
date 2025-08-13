@echo off
echo.
echo ========================================
echo   SaaS Starter Kit - Test Users Setup
echo ========================================
echo.
echo This script will create test users and tenants
echo for testing the SaaS application.
echo.
echo Press any key to continue...
pause >nul

echo.
echo Creating test users and tenants...
echo.

npm run create-test-users

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Test users have been created successfully.
echo.
echo Quick access:
echo   - Master Admin: admin@saas-starter.com / admin123!
echo   - Demo User: demo@saas-starter.com / demo123!
echo   - App URL: http://localhost:4002
echo.
echo Press any key to exit...
pause >nul
