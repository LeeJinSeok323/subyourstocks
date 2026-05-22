package com.stocker.notification;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.IDN;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class TelegramService {

    private static final Logger log = LoggerFactory.getLogger(TelegramService.class);
    private static final String API_BASE = "https://api.telegram.org/bot";

    @Value("${telegram.bot-token}")
    private String botToken;

    @Value("${telegram.server-url}")
    private String serverUrl;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    /** 한글 도메인 → 퓨니코드 변환 (https://한글.도메인 → https://xn--...) */
    private String toAsciiUrl(String url) {
        try {
            var uri = new java.net.URL(url);
            String asciiHost = IDN.toASCII(uri.getHost());
            return uri.getProtocol() + "://" + asciiHost + (uri.getPort() == -1 ? "" : ":" + uri.getPort()) + uri.getPath();
        } catch (Exception e) {
            return url;
        }
    }

    /** 앱 시작 시 webhook 자동 등록 (SERVER_DOMAIN 없으면 스킵) */
    @PostConstruct
    public void registerWebhook() {
        if (serverUrl == null || serverUrl.isBlank()) {
            log.info("SERVER_DOMAIN 미설정 - webhook 등록 스킵 (로컬 환경)");
            return;
        }
        String webhookUrl = toAsciiUrl(serverUrl + "/api/telegram/webhook");
        String body = "{\"url\":\"" + webhookUrl + "\"}";

        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE + botToken + "/setWebhook"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("Telegram webhook 등록: {} → {}", webhookUrl, response.body());
        } catch (Exception e) {
            log.error("Telegram webhook 등록 실패: {}", e.getMessage());
        }
    }

    public void send(String chatId, String ticker, String secType, String title) throws Exception {
        String text = String.format(
            "📢 *%s* SEC 공시 알림\n유형: `%s`\n내용: %s",
            ticker, secType, title
        );

        String body = String.format(
            "{\"chat_id\":\"%s\",\"text\":\"%s\",\"parse_mode\":\"Markdown\"}",
            chatId, text.replace("\"", "\\\"")
        );

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_BASE + botToken + "/sendMessage"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 400) {
            throw new RuntimeException("Telegram 발송 실패: " + response.body());
        }
    }
}
