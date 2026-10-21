// <copyright file="AccountingApiFactory.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

using Aumo.Accounting.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aumo.Accounting.Tests;

/// <summary>
/// Pabrik host untuk tes integrasi ringan. Memakai database in-memory agar tes autentikasi
/// tidak membutuhkan PostgreSQL. Tes yang menguji query nyata memakai PostgreSQL pada Fase 7.
/// </summary>
public sealed class AccountingApiFactory : WebApplicationFactory<Program>
{
    /// <inheritdoc/>
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase("accounting-tests"));
        });
    }
}
