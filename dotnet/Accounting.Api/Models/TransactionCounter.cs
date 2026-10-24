// <copyright file="TransactionCounter.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.Models;

using System;
using System.Collections.Generic;
/// <summary>
/// Mewakili Transaction Counter.
/// </summary>

public partial class TransactionCounter
{
    /// <summary>
    /// Mewakili Id.
    /// </summary>
    public int Id { get; set; }
    /// <summary>
    /// Mewakili User Id.
    /// </summary>

    public Guid UserId { get; set; }
    /// <summary>
    /// Mewakili Counter Key.
    /// </summary>

    public string CounterKey { get; set; } = null!;
    /// <summary>
    /// Mewakili Last Sequence.
    /// </summary>

    public int LastSequence { get; set; }
}
