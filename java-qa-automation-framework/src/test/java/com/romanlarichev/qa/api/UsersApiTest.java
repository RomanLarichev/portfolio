package com.romanlarichev.qa.api;

import com.github.tomakehurst.wiremock.WireMockServer;
import org.junit.jupiter.api.*;

import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("API: users")
class UsersApiTest {
    private WireMockServer mock;
    private ApiClient api;

    @BeforeEach
    void setUp() {
        mock = new WireMockServer(0);
        mock.start();
        api = new ApiClient("http://127.0.0.1:" + mock.port());
    }

    @Test
    @DisplayName("GET /api/users/42 returns contract data")
    void getUserReturnsContractData() {
        mock.stubFor(get(urlEqualTo("/api/users/42"))
                .willReturn(okJson("{\"id\":42,\"name\":\"Demo User\",\"role\":\"qa\"}")));

        var response = api.get("/api/users/42");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.jsonPath().getInt("id")).isEqualTo(42);
        assertThat(response.jsonPath().getString("role")).isEqualTo("qa");
        mock.verify(1, getRequestedFor(urlEqualTo("/api/users/42")));
    }

    @Test
    @DisplayName("POST /api/users sends JSON payload")
    void createUserSendsJsonPayload() {
        mock.stubFor(post(urlEqualTo("/api/users"))
                .withRequestBody(matchingJsonPath("$.username"))
                .willReturn(aResponse().withStatus(201).withHeader("Content-Type", "application/json")
                        .withBody("{\"id\":1001}")));

        var response = api.post("/api/users", Map.of("username", "qa_demo", "email", "qa@example.test"));

        assertThat(response.statusCode()).isEqualTo(201);
        assertThat(response.jsonPath().getInt("id")).isEqualTo(1001);
    }

    @AfterEach
    void tearDown() { mock.stop(); }
}
