package com.romanlarichev.qa.config;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class FrameworkConfigTest {
    @Test
    void defaultsArePortfolioSafe() {
        assertThat(FrameworkConfig.browser()).isNotBlank();
        assertThat(FrameworkConfig.uiTimeout().toSeconds()).isPositive();
    }
}
