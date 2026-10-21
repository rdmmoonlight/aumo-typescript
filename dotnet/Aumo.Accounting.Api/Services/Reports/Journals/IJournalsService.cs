namespace Aumo.Accounting.Api.Services.Reports.Journals;

public interface IJournalService
{
    Task<List<ClosingJournalEntryGroupApiResponse>> BuildClosingJournalGroupsAsync(AppDbContext db, Guid userId, Period period, IJournalsService reportService);
}
