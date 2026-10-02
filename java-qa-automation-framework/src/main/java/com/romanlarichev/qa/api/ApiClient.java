package com.romanlarichev.qa.api;

import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

/** Small REST Assured client facade with Allure request/response attachments. */
public final class ApiClient {
    private final String baseUrl;

    public ApiClient(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public Response get(String path) {
        return request().get(path);
    }

    public Response post(String path, Object body) {
        return request().body(body).post(path);
    }

    private RequestSpecification request() {
        return RestAssured.given()
                .baseUri(baseUrl)
                .contentType("application/json")
                .accept("application/json")
                .filter(new AllureRestAssured());
    }
}
