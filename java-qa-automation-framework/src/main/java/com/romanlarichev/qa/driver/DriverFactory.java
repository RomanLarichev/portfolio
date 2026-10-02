package com.romanlarichev.qa.driver;

import com.romanlarichev.qa.config.FrameworkConfig;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;

/** Thread-safe Selenium driver lifecycle for parallel-friendly tests. */
public final class DriverFactory {
    private static final ThreadLocal<WebDriver> DRIVER = new ThreadLocal<>();

    private DriverFactory() {}

    public static WebDriver start() {
        stop();
        WebDriver driver = switch (FrameworkConfig.browser().toLowerCase()) {
            case "firefox" -> new FirefoxDriver(firefoxOptions());
            case "chrome" -> new ChromeDriver(chromeOptions());
            default -> throw new IllegalArgumentException("Unsupported browser: " + FrameworkConfig.browser());
        };
        DRIVER.set(driver);
        return driver;
    }

    public static WebDriver get() {
        WebDriver driver = DRIVER.get();
        if (driver == null) throw new IllegalStateException("Driver is not started");
        return driver;
    }

    public static void stop() {
        WebDriver driver = DRIVER.get();
        if (driver != null) {
            try { driver.quit(); } finally { DRIVER.remove(); }
        }
    }

    private static ChromeOptions chromeOptions() {
        ChromeOptions options = new ChromeOptions();
        if (FrameworkConfig.headless()) options.addArguments("--headless=new");
        options.addArguments("--window-size=1440,1000", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage");
        return options;
    }

    private static FirefoxOptions firefoxOptions() {
        FirefoxOptions options = new FirefoxOptions();
        if (FrameworkConfig.headless()) options.addArguments("-headless");
        return options;
    }
}
