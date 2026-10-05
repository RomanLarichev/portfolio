using PortfolioQa.Core.Telemetry;

namespace PortfolioQa.Tests;

public class SelectorHealthStoreTests
{
    [Fact]
    public void Aggregates_selector_statistics()
    {
        var store = new SelectorHealthStore();
        store.Add(new SelectorHealthRecord { FieldName = "email", Selector = "[data-testid='email']", Strategy = "data-testid", Success = true, ResolveTimeMs = 8 });
        store.Add(new SelectorHealthRecord { FieldName = "email", Selector = "[data-testid='email']", Strategy = "data-testid", Success = true, ResolveTimeMs = 12 });
        store.Add(new SelectorHealthRecord { FieldName = "email", Selector = "#email", Strategy = "stable-id", Success = false, ResolveTimeMs = 3 });

        var stats = store.GetFieldStats("email");
        Assert.Equal(3, stats.TotalAttempts);
        Assert.Equal(2, stats.SuccessCount);
        Assert.InRange(stats.SuccessRate, 66.6, 66.7);
        Assert.Equal("[data-testid='email']", stats.BestSelector);
    }
}
