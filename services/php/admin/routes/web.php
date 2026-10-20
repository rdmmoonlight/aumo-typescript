<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PeriodController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    Route::prefix('periods')->name('periods.')->group(function () {
        Route::get('/', [PeriodController::class, 'index'])->name('index');
        Route::get('/create', [PeriodController::class, 'create'])->name('create');
        Route::post('/', [PeriodController::class, 'store'])->name('store');
        Route::get('/{period}', [PeriodController::class, 'show'])->name('show');
        Route::get('/{period}/edit', [PeriodController::class, 'edit'])->name('edit');
        Route::put('/{period}', [PeriodController::class, 'update'])->name('update');
    });

    // Tambahkan rute lain di sini (COA, Journal, Reports, dll.)
});
