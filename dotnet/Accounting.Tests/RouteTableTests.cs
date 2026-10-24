// <copyright file="RouteTableTests.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc.ActionConstraints;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Accounting.Tests;

/// <summary>
/// Mengunci tabel rute akuntansi (23 endpoint) agar tidak bergeser tanpa disengaja,
/// termasuk kesalahan token <c>[controller]</c> yang menempel pada path.
/// </summary>
public class RouteTableTests : IClassFixture<AccountingApiFactory>
{
    private static readonly string[] ExpectedRoutes =
    {
        "DELETE api/chart-of-accounts/{id:int}",
        "DELETE api/reports/journals/adjusting/{id:int}",
        "GET api/chart-of-accounts",
        "GET api/periods",
        "GET api/periods/open-info",
        "GET api/reports/general-ledgers/permanent",
        "GET api/reports/general-ledgers/temporary",
        "GET api/reports/income-statement",
        "GET api/reports/journals/adjusting",
        "GET api/reports/journals/closing",
        "GET api/reports/journals/general",
        "GET api/reports/retained-earnings",
        "GET api/reports/statement-of-cash-flow",
        "GET api/reports/statement-of-financial-position",
        "GET api/reports/summary",
        "GET api/reports/worksheet",
        "POST api/chart-of-accounts",
        "POST api/periods",
        "POST api/periods/clear-selection",
        "POST api/periods/close/{id:int}",
        "POST api/periods/select/{id:int}",
        "POST api/reports/general-ledgers/refresh",
        "PUT api/chart-of-accounts/{id:int}",
    };

    private readonly AccountingApiFactory factory;

    public RouteTableTests(AccountingApiFactory factory)
    {
        this.factory = factory;
    }

    [Fact]
    public void RouteTable_MatchesExpectedEndpoints()
    {
        var provider = this.factory.Services.GetRequiredService<IActionDescriptorCollectionProvider>();

        var actual = provider.ActionDescriptors.Items
            .Where(a => a.AttributeRouteInfo != null)
            .Select(a =>
                (a.ActionConstraints?.OfType<HttpMethodActionConstraint>().FirstOrDefault()?.HttpMethods.FirstOrDefault() ?? "?")
                + " " + a.AttributeRouteInfo!.Template!.ToLowerInvariant())
            .OrderBy(x => x, StringComparer.Ordinal)
            .ToList();

        Assert.Equal(ExpectedRoutes.Length, actual.Count);
        Assert.Equal(ExpectedRoutes, actual);
    }
}
