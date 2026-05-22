package com.stocker.notification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TelegramLinkService {

    private final JdbcTemplate jdbc;

    @Value("${telegram.bot-username}")
    private String botUsername;

    public TelegramLinkService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** 임시 토큰 발급 → 등록 링크 반환 */
    public Map<String, String> generateLink(Long userId) {
        jdbc.update("DELETE FROM telegram_link_token WHERE expires_at < NOW()");
        jdbc.update("DELETE FROM telegram_link_token WHERE user_id = ?", userId);

        String token = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);

        jdbc.update(
            "INSERT INTO telegram_link_token (token, user_id, expires_at) VALUES (?, ?, ?)",
            token, userId, expiresAt
        );

        return Map.of("link", "https://t.me/" + botUsername + "?start=" + token);
    }

    /** webhook: /start {token} 수신 시 chat_id 저장 */
    public void processStart(String token, String chatId) {
        List<Long> userIds = jdbc.queryForList(
            "SELECT user_id FROM telegram_link_token WHERE token = ? AND expires_at > NOW()",
            Long.class, token
        );
        if (userIds.isEmpty()) return;

        Long userId = userIds.get(0);
        jdbc.update("UPDATE users SET telegram_chat_id = ? WHERE id = ?", chatId, userId);
        jdbc.update("DELETE FROM telegram_link_token WHERE token = ?", token);
    }

    /** 등록 여부 확인 */
    public boolean isRegistered(Long userId) {
        List<String> result = jdbc.queryForList(
            "SELECT telegram_chat_id FROM users WHERE id = ? AND telegram_chat_id IS NOT NULL AND telegram_chat_id != ''",
            String.class, userId
        );
        return !result.isEmpty();
    }
}
