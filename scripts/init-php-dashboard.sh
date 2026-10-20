#!/usr/bin/env bash
set -e

cd services/php
composer create-project laravel/laravel admin --prefer-dist
cd admin
cp .env.example .env
php artisan key:generate
# Tambahkan DB connection ke .env sesuai kebutuhan
echo "PHP Dashboard berhasil diinisialisasi di services/php/admin"
