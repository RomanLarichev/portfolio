package com.romanlarichev.qa.support;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

/** Local disposable web app used by Selenium tests. No external test site is required. */
public final class DemoWebServer implements AutoCloseable {
    private final HttpServer server;

    public DemoWebServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/login", this::login);
        server.createContext("/dashboard", exchange -> html(exchange, 200,
                "<html><head><title>Dashboard</title></head><body><h1 id='welcome'>Welcome, demo</h1></body></html>"));
    }

    public void start() { server.start(); }

    public String baseUrl() {
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    private void login(HttpExchange exchange) throws IOException {
        String page = """
            <html><head><title>Demo Login</title></head><body>
              <form id='loginForm'>
                <input id='username' aria-label='Username'>
                <input id='password' type='password' aria-label='Password'>
                <button id='submit' type='submit'>Sign in</button>
                <div id='error' role='alert'></div>
              </form>
              <script>
                document.getElementById('loginForm').addEventListener('submit', function(e) {
                  e.preventDefault();
                  const u = document.getElementById('username').value;
                  const p = document.getElementById('password').value;
                  if (u === 'demo' && p === 'demo123') window.location.href = '/dashboard';
                  else document.getElementById('error').textContent = 'Invalid credentials';
                });
              </script>
            </body></html>
            """;
        html(exchange, 200, page);
    }

    private static void html(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    @Override public void close() { server.stop(0); }
}
