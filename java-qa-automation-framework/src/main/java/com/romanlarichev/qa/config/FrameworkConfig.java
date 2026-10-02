package com.romanlarichev.qa.config;

import java.time.Duration;

/**
 * Small configuration facade for the public portfolio edition.
 * Values can be overridden with -D properties or environment variables.
 */
public final class FrameworkConfig {
    private FrameworkConfig() {}

    public static String browser() {
        return value("browser", "BROWSER", "chrome");
    }

    public static boolean headless() {
        return Boolean.parseBoolean(value("headless", "HEADLESS", "true"));
    }

    public static Duration uiTimeout() {
        long seconds = Long.parseLong(value("ui.timeout.seconds", "UI_TIMEOUT_SECONDS", "10"));
        return Duration.ofSeconds(seconds);
    }

    private static String value(String property, String env, String fallback) {
        String systemValue = System.getProperty(property);
        if (systemValue != null && !systemValue.isBlank()) return systemValue;
        String envValue = System.getenv(env);
        return envValue == null || envValue.isBlank() ? fallback : envValue;
    }
}
