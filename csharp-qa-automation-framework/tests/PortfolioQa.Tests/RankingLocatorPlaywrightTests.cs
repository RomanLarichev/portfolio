using PortfolioQa.Core.Locators;
using PortfolioQa.Core.Telemetry;
using PortfolioQa.Infrastructure;

namespace PortfolioQa.Tests;

public class RankingLocatorPlaywrightTests
{
    [Fact]
    public async Task Prefers_test_id_and_records_health()
    {
        await using var browser = new BrowserSession();
        var page = await browser.NewPageAsync();
        await page.SetContentAsync("""
            <html><body>
              <label for='dynamic-field'>Email</label>
              <input id='dynamic-field' name='email' aria-label='Email address' data-testid='email' />
            </body></html>
            """);

        var store = new SelectorHealthStore();
        var locator = new RankingLocator(page, health: new SelectorHealthMonitor(store));
        var resolved = await locator.FindBestAsync("email");

        Assert.NotNull(resolved);
        await resolved!.FillAsync("qa@example.test");
        Assert.Equal("qa@example.test", await resolved.InputValueAsync());
        Assert.Contains(store.GetAll(), x => x.Success && x.Strategy == "data-testid");
    }
}
