package com.stocker.auth;

import com.stocker.auth.dto.AdminUserDto;
import com.stocker.auth.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbc;

    private final RowMapper<User> userRowMapper = (rs, rowNum) -> new User(
        rs.getLong("id"),
        rs.getString("username"),
        rs.getString("password"),
        rs.getString("message"),
        rs.getString("status"),
        rs.getString("role")
    );

    private final RowMapper<AdminUserDto> adminUserMapper = (rs, rowNum) -> new AdminUserDto(
        rs.getLong("id"),
        rs.getString("username"),
        rs.getString("message"),
        rs.getString("status"),
        rs.getString("created_at")
    );

    // @Primary 인 mysqlJdbcTemplate 자동 주입
    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<User> findByUsername(String username) {
        var list = jdbc.query(
            "SELECT id, username, password, message, status, role FROM users WHERE username = ?",
            userRowMapper, username
        );
        return list.stream().findFirst();
    }

    public boolean existsByUsername(String username) {
        var count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM users WHERE username = ?",
            Integer.class, username
        );
        return count != null && count > 0;
    }

    /** 회원가입 신청 저장 (status=PENDING, role=USER) */
    public void save(String username, String encodedPassword, String message) {
        jdbc.update(
            "INSERT INTO users (username, password, message, status, role) VALUES (?, ?, ?, 'PENDING', 'USER')",
            username, encodedPassword, message
        );
    }

    /** 관리자용: 전체 가입신청 목록 (최신순) */
    public List<AdminUserDto> findAllApplications() {
        return jdbc.query(
            "SELECT id, username, message, status, created_at FROM users ORDER BY created_at DESC",
            adminUserMapper
        );
    }

    /** 승인 / 거절 */
    public void updateStatus(Long id, String status) {
        jdbc.update("UPDATE users SET status = ? WHERE id = ?", status, id);
    }
}
