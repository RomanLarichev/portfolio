using PortfolioQa.Core.Utils;

namespace PortfolioQa.Tests;

public class StringNormalizerTests
{
    [Fact]
    public void Metadata_text_is_sanitized()
    {
        var value = StringNormalizer.SanitizeForMetadata("  Customer   name :focus  ");
        Assert.Equal("Customer name", value);
    }

    [Theory]
    [InlineData("!")]
    [InlineData("{ color:red }")]
    public void Garbage_text_is_detected(string value) => Assert.True(StringNormalizer.IsGarbageText(value));
}
