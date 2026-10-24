// <copyright file="AuthorizationCoverageTests.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Xunit;

namespace Accounting.Tests;

/// <summary>
/// Memastikan seluruh endpoint akuntansi terlindungi dan jumlahnya sesuai dokumen migrasi (23).
/// </summary>
public class AuthorizationCoverageTests
{
    private const int ExpectedEndpointCount = 23;

    private static List<Type> Controllers()
    {
        return typeof(Program).Assembly.GetTypes()
            .Where(t => typeof(ControllerBase).IsAssignableFrom(t) && !t.IsAbstract)
            .ToList();
    }

    private static List<MethodInfo> Endpoints()
    {
        return Controllers()
            .SelectMany(t => t.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
            .Where(m => m.GetCustomAttributes<HttpMethodAttribute>().Any())
            .ToList();
    }

    [Fact]
    public void EveryController_RequiresAuthorization()
    {
        foreach (var controller in Controllers())
        {
            Assert.True(
                controller.GetCustomAttribute<AuthorizeAttribute>() != null,
                $"{controller.Name} tidak memiliki [Authorize].");
            Assert.Null(controller.GetCustomAttribute<AllowAnonymousAttribute>());
        }
    }

    [Fact]
    public void NoEndpoint_AllowsAnonymousAccess()
    {
        foreach (var endpoint in Endpoints())
        {
            Assert.True(
                endpoint.GetCustomAttribute<AllowAnonymousAttribute>() == null,
                $"{endpoint.DeclaringType?.Name}.{endpoint.Name} memakai [AllowAnonymous].");
        }
    }

    [Fact]
    public void AccountingApi_Exposes23Endpoints()
    {
        Assert.Equal(ExpectedEndpointCount, Endpoints().Count);
    }
}
