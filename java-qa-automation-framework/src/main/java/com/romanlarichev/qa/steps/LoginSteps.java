package com.romanlarichev.qa.steps;

import com.romanlarichev.qa.pages.LoginPage;
import io.qameta.allure.Step;

public final class LoginSteps {
    private final LoginPage page;

    public LoginSteps(LoginPage page) {
        this.page = page;
    }

    @Step("Authorize demo user")
    public void authorizeDemoUser() {
        page.open().login("demo", "demo123");
        if (!page.isDashboardOpened()) {
            throw new AssertionError("Dashboard was not opened after valid login");
        }
    }
}
