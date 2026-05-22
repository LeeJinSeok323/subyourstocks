package com.stocker.alert;

import com.stocker.alert.dto.AlertRequest;
import com.stocker.auth.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AlertService {

    private final JdbcTemplate jdbc;
    private final UserRepository userRepository;

    public AlertService(JdbcTemplate jdbc, UserRepository userRepository) {
        this.jdbc = jdbc;
        this.userRepository = userRepository;
    }

    /**
     * 알림 조회
     * 반환: { active: true, types: ["8-K", "10-K"] } or { active: false }
     */
    public Map<String, Object> getAlert(String username, String ticker) {
        Long userId = getUserId(username);

        Optional<Long> alarmId = findAlarmId(userId, ticker);
        if (alarmId.isEmpty()) {
            return Map.of("active", false);
        }

        List<String> types = jdbc.queryForList(
            "SELECT alert_type FROM alarm_dtl WHERE alarm_id = ?",
            String.class, alarmId.get()
        );

        return Map.of("active", true, "types", types);
    }

    /**
     * 알림 저장 (upsert)
     * 1) alarm upsert → alarm_id 확보
     * 2) alarm_dtl 전체 교체 (delete → insert)
     */
    @Transactional
    public void saveAlert(String username, String ticker, AlertRequest req) {
        Long userId  = getUserId(username);
        Long alarmId = upsertAlarm(userId, ticker);

        // 기존 상세 전체 삭제 후 재삽입
        jdbc.update("DELETE FROM alarm_dtl WHERE alarm_id = ?", alarmId);

        if (req.types() != null) {
            for (String type : req.types()) {
                jdbc.update(
                    "INSERT INTO alarm_dtl (alarm_id, alert_type) VALUES (?, ?)",
                    alarmId, type
                );
            }
        }
    }

    /**
     * 알림 삭제 (alarm_dtl은 CASCADE로 자동 삭제)
     */
    public void deleteAlert(String username, String ticker) {
        Long userId = getUserId(username);
        jdbc.update(
            "DELETE FROM alarm WHERE user_id = ? AND ticker = ?",
            userId, ticker
        );
    }

    /* ── private ── */

    private Optional<Long> findAlarmId(Long userId, String ticker) {
        List<Long> ids = jdbc.queryForList(
            "SELECT id FROM alarm WHERE user_id = ? AND ticker = ?",
            Long.class, userId, ticker
        );
        return ids.stream().findFirst();
    }

    /** alarm 없으면 INSERT, 있으면 그대로 → id 반환 */
    private Long upsertAlarm(Long userId, String ticker) {
        Optional<Long> existing = findAlarmId(userId, ticker);
        if (existing.isPresent()) return existing.get();

        var keyHolder = new GeneratedKeyHolder();
        jdbc.update(con -> {
            var ps = con.prepareStatement(
                "INSERT INTO alarm (user_id, ticker) VALUES (?, ?)",
                Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, userId);
            ps.setString(2, ticker);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) throw new RuntimeException("alarm INSERT 실패: 생성된 키 없음");
        return key.longValue();
    }

    private Long getUserId(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."))
            .id();
    }
}
