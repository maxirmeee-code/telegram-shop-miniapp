@echo off
echo ========================================
echo   DEPLOIEMENT SUR VERCEL (Windows)
echo ========================================
echo.

echo Installation des dependances...
npm install

echo.
echo ========================================
echo   ATTENTION : NE FERME PAS CETTE FENETRE
echo ========================================
echo.
echo Appuie sur ENTREE pour lancer le deploiement...
pause

echo.
echo Lancement du deploiement sur Vercel...
npx vercel --prod

echo.
echo ========================================
echo   DEPLOIEMENT TERMINE !
echo   Si tu vois une URL, c'est bon !
echo ========================================
pause