@echo off
title Stop Glassmorphism Dashboard
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0stopdashboard.ps1"
