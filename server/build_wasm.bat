@echo off
cd /d %~dp0
set GOOS=js
set GOARCH=wasm
go build -o ../public/wasm/charger.wasm
