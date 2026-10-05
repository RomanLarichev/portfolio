using Microsoft.Playwright;

namespace PortfolioQa.Infrastructure;

/// <summary>Minimal disposable Playwright session used by portfolio tests.</summary>
public sealed class BrowserSession : IAsyncDisposable
{
    private IPlaywright? _playwright;
    private IBrowser? _browser;

    public async Task<IPage> NewPageAsync(bool headless = true)
    {
        _playwright ??= await Playwright.CreateAsync();
        _browser ??= await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = headless });
        var context = await _browser.NewContextAsync(new BrowserNewContextOptions { Locale = "en-US" });
        return await context.NewPageAsync();
    }

    public async ValueTask DisposeAsync()
    {
        if (_browser is not null) await _browser.CloseAsync();
        _playwright?.Dispose();
    }
}
