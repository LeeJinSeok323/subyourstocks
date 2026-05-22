package com.stocker.notification;

import com.stocker.auth.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/telegram")
public class TelegramController {

    private final TelegramLinkService linkService;
    private final UserRepository userRepository;

    public TelegramController(TelegramLinkService linkService, UserRepository userRepository) {
        this.linkService = linkService;
        this.userRepository = userRepository;
    }

    /** 등록 링크 발급 */
    @PostMapping("/link-token")
    public Object generateLink(Authentication auth) {
        Long userId = getUserId(auth.getName());
        return linkService.generateLink(userId);
    }

    /** 등록 여부 확인 (프론트 polling용) */
    @GetMapping("/status")
    public Object status(Authentication auth) {
        Long userId = getUserId(auth.getName());
        return Map.of("registered", linkService.isRegistered(userId));
    }

    /** 텔레그램 서버 → Spring webhook (인증 없이 허용) */
    @PostMapping("/webhook")
    public Object webhook(@RequestBody Map<String, Object> body) {
        try {
            var message = (Map<?, ?>) body.get("message");
            if (message == null) return Map.of("ok", true);

            var chat = (Map<?, ?>) message.get("chat");
            String chatId = String.valueOf(chat.get("id"));
            String text   = (String) message.get("text");

            if (text != null && text.startsWith("/start ")) {
                String token = text.substring(7).trim();
                linkService.processStart(token, chatId);
            }

            return Map.of("ok", true);
        } catch (Exception e) {
            return Map.of("ok", false);
        }
    }

    private Long getUserId(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("사용자 없음"))
            .id();
    }
}
