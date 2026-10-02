package com.romanlarichev.qa.data;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class TestDataGeneratorTest {
    @Test
    void generatedUsersAreUniqueAndSynthetic() {
        var first = TestDataGenerator.user();
        var second = TestDataGenerator.user();
        assertThat(first.email()).endsWith("@example.test");
        assertThat(second.email()).isNotEqualTo(first.email());
        assertThat(first.password()).contains("#");
    }
}
