package com.stocker.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AlertNotificationService {

    private static final Logger log = LoggerFactory.getLogger(AlertNotificationService.class);

    private final JdbcTemplate jdbc;
    private final TelegramService telegramService;

    public AlertNotificationService(JdbcTemplate jdbc, TelegramService telegramService) {
        this.jdbc = jdbc;
        this.telegramService = telegramService;
    }

    public void notifySecFiling(String ticker, String secType, String title) {
        String sql = """
            SELECT u.telegram_chat_id
            FROM alarm a
            JOIN alarm_dtl d ON d.alarm_id = a.id
            JOIN users u     ON u.id = a.user_id
            WHERE a.ticker    = ?
              AND d.alert_type = ?
              AND u.telegram_chat_id IS NOT NULL
              AND u.telegram_chat_id != ''
            """;

        List<Map<String, Object>> targets = jdbc.queryForList(sql, ticker, secType);

        log.info("SEC 공시 알림 대상: {}명 (ticker={}, type={})", targets.size(), ticker, secType);

        for (Map<String, Object> row : targets) {
            String chatId = (String) row.get("telegram_chat_id");
            try {
                telegramService.send(chatId, ticker, secType, title);
                log.info("텔레그램 발송 성공: {}", chatId);
            } catch (Exception e) {
                log.error("텔레그램 발송 실패: {} → {}", chatId, e.getMessage());
            }
        }
    }
}
