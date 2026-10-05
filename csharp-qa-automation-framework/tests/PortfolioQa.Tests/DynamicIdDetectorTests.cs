using PortfolioQa.Core.Discovery;

namespace PortfolioQa.Tests;

public class DynamicIdDetectorTests
{
    [Theory]
    [InlineData("ant-blazor-a1b2c3")]
    [InlineData("7d196b7d-2f4c-4251-97bd-8eef2bf7e7ea")]
    [InlineData("blazor_deadbeef")]
    public void Dynamic_ids_are_detected(string value) => Assert.True(DynamicIdDetector.IsDynamic(value));

    [Theory]
    [InlineData("username")]
    [InlineData("submit-button")]
    [InlineData("customerName")]
    public void Stable_ids_are_not_rejected(string value) => Assert.True(DynamicIdDetector.IsStable(value));
}
