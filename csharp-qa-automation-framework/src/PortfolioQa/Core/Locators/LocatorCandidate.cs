using Microsoft.Playwright;

namespace PortfolioQa.Core.Locators;

public sealed class LocatorCandidate
{
    public required string Selector { get; init; }
    public required string Strategy { get; init; }
    public required int Score { get; init; }
    public required ILocator Locator { get; init; }
}
