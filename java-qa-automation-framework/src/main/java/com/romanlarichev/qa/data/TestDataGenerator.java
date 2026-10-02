package com.romanlarichev.qa.data;

import com.romanlarichev.qa.model.TestUser;
import java.util.UUID;

/** Minimal synthetic test-data helper kept intentionally deterministic only where needed by a test. */
public final class TestDataGenerator {
    private TestDataGenerator() {}

    public static String uniqueSuffix() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    public static TestUser user() {
        String suffix = uniqueSuffix();
        return new TestUser(
                "qa_" + suffix,
                "qa." + suffix + "@example.test",
                "Demo#" + suffix + "A1"
        );
    }
}
