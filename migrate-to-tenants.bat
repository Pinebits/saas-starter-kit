@echo off
echo =============================================
echo Teams to Tenants Migration Process
echo =============================================
echo.
echo This script will migrate your database from Teams to Tenants model.
echo It involves several steps:
echo 1. Generate a new Prisma migration
echo 2. Apply the migration to the database
echo 3. Run the data migration script
echo 4. Designate a master administrator
echo.
echo IMPORTANT: Make sure you have a backup of your database before proceeding.
echo.
set /p continue=Do you want to continue? (y/n): 

if /i "%continue%" neq "y" (
    echo Migration aborted.
    exit /b
)

echo.
echo Generating Prisma migration...
npx prisma migrate dev --name teams-to-tenants

if %errorlevel% neq 0 (
    echo Error generating migration. Aborting.
    exit /b %errorlevel%
)

echo.
echo Migration generated and applied successfully!
echo.
echo Now we need to designate a master administrator.
echo.
set /p adminEmail=Enter the email address of the user to designate as master administrator: 

if "%adminEmail%"=="" (
    echo No email provided. Aborting.
    exit /b 1
)

echo.
echo Running data migration script...
node scripts/migrate-teams-to-tenants.js %adminEmail%

if %errorlevel% neq 0 (
    echo Error in data migration. Please check the logs.
    exit /b %errorlevel%
)

echo.
echo =============================================
echo Migration completed successfully!
echo =============================================
echo.
echo User %adminEmail% has been designated as a master administrator.
echo You can now access the admin dashboard at /admin
echo.
echo Enjoy your new multi-tenant system!
echo =============================================