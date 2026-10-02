package com.romanlarichev.qa.pages;

import io.qameta.allure.Step;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public final class LoginPage extends BasePage {
    private final String baseUrl;
    private final By username = By.id("username");
    private final By password = By.id("password");
    private final By submit = By.id("submit");
    private final By error = By.id("error");

    public LoginPage(WebDriver driver, String baseUrl) {
        super(driver);
        this.baseUrl = baseUrl;
    }

    @Step("Open demo login page")
    public LoginPage open() {
        driver.get(baseUrl + "/login");
        waits.visible(username);
        return this;
    }

    @Step("Login as {user}")
    public LoginPage login(String user, String pass) {
        waits.visible(username).clear();
        driver.findElement(username).sendKeys(user);
        driver.findElement(password).clear();
        driver.findElement(password).sendKeys(pass);
        waits.clickable(submit).click();
        return this;
    }

    public boolean isDashboardOpened() {
        return waits.urlContains("/dashboard");
    }

    public String errorText() {
        return waits.visible(error).getText();
    }
}
