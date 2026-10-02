package com.romanlarichev.qa.ui;

import com.romanlarichev.qa.driver.DriverFactory;
import com.romanlarichev.qa.pages.LoginPage;
import com.romanlarichev.qa.support.DemoWebServer;
import org.junit.jupiter.api.*;
import org.openqa.selenium.WebDriver;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("UI: demo authentication")
class LoginUiTest {
    private static DemoWebServer app;
    private WebDriver driver;
    private LoginPage loginPage;

    @BeforeAll
    static void startApp() throws Exception {
        app = new DemoWebServer();
        app.start();
    }

    @BeforeEach
    void setUp() {
        driver = DriverFactory.start();
        loginPage = new LoginPage(driver, app.baseUrl());
    }

    @Test
    @DisplayName("Valid credentials open dashboard")
    void validCredentialsOpenDashboard() {
        loginPage.open().login("demo", "demo123");
        assertThat(loginPage.isDashboardOpened()).isTrue();
        assertThat(driver.getTitle()).isEqualTo("Dashboard");
    }

    @Test
    @DisplayName("Invalid credentials show validation error")
    void invalidCredentialsShowError() {
        loginPage.open().login("wrong", "wrong");
        assertThat(loginPage.errorText()).isEqualTo("Invalid credentials");
    }

    @AfterEach
    void tearDown() { DriverFactory.stop(); }

    @AfterAll
    static void stopApp() { app.close(); }
}
