// <copyright file="SelectedPeriodHelper.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

using System;
using System.Linq;
using System.Threading.Tasks;
using Accounting.Api.Data;
using Accounting.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Api.Helpers
{
    /// <summary>
    /// Helper untuk mengelola dan mengambil data periode yang terpilih.
    /// </summary>
    public static class SelectedPeriodHelper
    {
        /// <summary>
        /// Mengambil data periode yang sedang dipilih oleh user secara asynchronous.
        /// </summary>
        /// <param name="db">Database context.</param>
        /// <param name="userId">ID milik user.</param>
        /// <returns>Objek <see cref="Period"/> yang terpilih, atau <c>null</c> jika tidak ditemukan.</returns>
        public static async Task<Period?> GetSelectedPeriodAsync(AppDbContext db, Guid userId)
        {
            if (db == null || userId == Guid.Empty)
            {
                return null;
            }

            return await db.Periods
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId && p.IsSelected);
        }

        /// <summary>
        /// Memilih satu periode tertentu untuk user dan menghapus status terpilih dari periode lainnya.
        /// </summary>
        /// <param name="db">Database context.</param>
        /// <param name="userId">ID milik user.</param>
        /// <param name="periodId">ID periode yang akan dipilih.</param>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public static async Task SelectPeriodAsync(AppDbContext db, Guid userId, int periodId)
        {
            if (db == null || userId == Guid.Empty)
            {
                return;
            }

            var userPeriods = await db.Periods
                .Where(p => p.UserId == userId)
                .ToListAsync();

            foreach (var period in userPeriods)
            {
                period.IsSelected = period.Id == periodId;
            }

            await db.SaveChangesAsync();
        }

        /// <summary>
        /// Menghapus semua pilihan periode milik user yang bersangkutan.
        /// </summary>
        /// <param name="db">Database context.</param>
        /// <param name="userId">ID milik user.</param>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public static async Task ClearSelectionAsync(AppDbContext db, Guid userId)
        {
            if (db == null || userId == Guid.Empty)
            {
                return;
            }

            await db.Periods
                .Where(p => p.UserId == userId && p.IsSelected)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsSelected, false));
        }
    }
}
