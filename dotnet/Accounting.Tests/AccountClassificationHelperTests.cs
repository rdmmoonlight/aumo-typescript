namespace Accounting.Tests;

using Accounting.Api.Models;
using Xunit;

public class AccountClassificationHelperTests
{
    [Theory]
    [InlineData("Assets", 100, true)]
    [InlineData("Assets", 199, true)]
    [InlineData("Assets", 200, false)]
    [InlineData("Liabilities", 200, true)]
    [InlineData("Liabilities", 299, true)]
    [InlineData("Equity", 300, true)]
    [InlineData("OperatingIncome", 450, true)]
    [InlineData("OperatingExpenses", 550, true)]
    [InlineData("OtherIncome", 700, true)]
    [InlineData("OtherExpenses", 850, true)]
    [InlineData("OtherExpenses", 1000, false)]
    public void ValidateReferenceNumber_ValidatesRangesCorrectly(string type, int refNum, bool expected)
    {
        var result = AccountClassificationHelper.ValidateReferenceNumber(type, refNum);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("Assets", true)]
    [InlineData("OperatingExpenses", true)]
    [InlineData("OtherExpenses", true)]
    [InlineData("Liabilities", false)]
    [InlineData("Equity", false)]
    [InlineData("OperatingIncome", false)]
    [InlineData("OtherIncome", false)]
    public void NormalBalanceIsDebit_ReturnsCorrectBalance(string type, bool expectedDebit)
    {
        var result = AccountClassificationHelper.NormalBalanceIsDebit(type);
        Assert.Equal(expectedDebit, result);
    }
}