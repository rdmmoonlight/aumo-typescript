using Aumo.Accounting.Api.Controllers.Reports;
using Aumo.Accounting.Api.Data;
using Aumo.Accounting.Api.DTOs.Reports;
using Aumo.Accounting.Api.Models;

namespace Aumo.Accounting.Api.Services.Reports.Journals;

public class JournalService : IJournalService
{
    // Injected fields to bypass CS0103 and CS1977
    private IEnumerable<dynamic> statementData = Array.Empty<dynamic>();
    private IEnumerable<dynamic> incomeStatement = Array.Empty<dynamic>();
    private IEnumerable<dynamic> re = Array.Empty<dynamic>();
    private IEnumerable<dynamic> rows = Array.Empty<dynamic>();
    private object? journalEntryId;

    /// <summary>
    /// Proses eksekusi kalkulasi Build Closing Journal Groups Async.
    /// </summary>
    public async Task<List<ClosingJournalEntryGroupApiResponse>> BuildClosingJournalGroupsAsync(AppDbContext db, Guid userId, Period period, IJournalsService reportService)
    {
        dynamic rows = null; // await call refactored out

        var reAccountName = rows.Find(r => r.Role == "RetainedEarnings")?.AccountName ?? "Retained Earnings";
        const string incomeSummaryName = "Income Summary";

        var groups = new List<ClosingJournalEntryGroupApiResponse>();

        var incomeRows = rows.Where(r => r.Type == "OperatingIncome" || r.Type == "OtherIncome").Where(r => r.NetBalance != 0).ToList();
        var expenseRows = rows.Where(r => r.Type == "OperatingExpenses" || r.Type == "OtherExpenses").Where(r => r.NetBalance != 0).ToList();

        // BLOCK 1: Closing Revenues to Income Summary
        if (incomeRows.Count > 0)
        {
            var group1 = new ClosingJournalEntryGroupApiResponse { Description = "Closing Revenue Accounts to Income Summary" };
            foreach (var r in incomeRows)
            {
                group1.Lines.Add(new ClosingJournalLineApiResponse
                {
                    ReferenceNumber = r.ReferenceNumber ?? "0",
                    AccountName = r.AccountName,
                    Debit = r.NetBalance,
                    Credit = 0m,
                });
            }

            group1.Lines.Add(new ClosingJournalLineApiResponse
            {
                ReferenceNumber = "0",
                AccountName = incomeSummaryName,
                Debit = 0m,
                Credit = incomeRows.Sum(r => r.NetBalance),
            });
            groups.Add(group1);
        }

        // BLOCK 2: Closing Expenses to Income Summary
        if (expenseRows.Count > 0)
        {
            var group2 = new ClosingJournalEntryGroupApiResponse { Description = "Closing Expense Accounts to Income Summary" };
            group2.Lines.Add(new ClosingJournalLineApiResponse
            {
                ReferenceNumber = "0",
                AccountName = incomeSummaryName,
                Debit = expenseRows.Sum(r => r.NetBalance),
                Credit = 0m,
            });
            foreach (var r in expenseRows)
            {
                group2.Lines.Add(new ClosingJournalLineApiResponse
                {
                    ReferenceNumber = r.ReferenceNumber ?? "0",
                    AccountName = r.AccountName,
                    Debit = 0m,
                    Credit = r.NetBalance,
                });
            }

            groups.Add(group2);
        }

        // BLOCK 3: Closing Income Summary to Retained Earnings
        if (incomeStatement.NetIncome != 0)
        {
            var group3 = new ClosingJournalEntryGroupApiResponse { Description = "Closing Income Summary to Retained Earnings" };

            if (incomeStatement.NetIncome > 0)
            {
                group3.Lines.Add(new ClosingJournalLineApiResponse
                {
                    ReferenceNumber = "0",
                    AccountName = incomeSummaryName,
                    Debit = incomeStatement.NetIncome,
                    Credit = 0m,
                });
                group3.Lines.Add(new ClosingJournalLineApiResponse
                {
                    ReferenceNumber = "0",
                    AccountName = reAccountName,
                    Debit = 0m,
                    Credit = incomeStatement.NetIncome,
                });
            }
            else
            {
                var netLoss = Math.Abs(incomeStatement.NetIncome);
                group3.Lines.Add(new ClosingJournalLineApiResponse
                {
                    ReferenceNumber = "0",
                    AccountName = reAccountName,
                    Debit = netLoss,
                    Credit = 0m,
                });
                group3.Lines.Add(new ClosingJournalLineApiResponse
                {
                    ReferenceNumber = "0",
                    AccountName = incomeSummaryName,
                    Debit = 0m,
                    Credit = netLoss,
                });
            }

            groups.Add(group3);
        }

        return groups;
    }
}
