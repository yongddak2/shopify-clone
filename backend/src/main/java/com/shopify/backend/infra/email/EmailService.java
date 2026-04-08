package com.shopify.backend.infra.email;

import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendPasswordResetCode(String email, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("[SHOPIFY] 비밀번호 재설정 인증번호");
            helper.setText(buildHtml(code), true);

            mailSender.send(message);
            log.info("비밀번호 재설정 인증번호 발송 완료: {}", email);
        } catch (MessagingException e) {
            log.error("비밀번호 재설정 인증번호 발송 실패: {}", email, e);
            throw new BusinessException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    private String buildHtml(String code) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                </head>
                <body style="margin:0; padding:0; background-color:#2a2a2a; font-family:'Helvetica Neue',Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#2a2a2a; padding:40px 0;">
                    <tr>
                      <td align="center">
                        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1e1e1e; border-radius:8px; overflow:hidden;">
                          <tr>
                            <td style="padding:40px 40px 20px 40px; text-align:center;">
                              <h1 style="color:#ffffff; font-size:20px; letter-spacing:0.2em; font-weight:300; margin:0;">SHOPIFY</h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 40px 20px 40px; text-align:center;">
                              <h2 style="color:#ffffff; font-size:16px; font-weight:400; margin:0 0 12px 0;">비밀번호 재설정 인증번호</h2>
                              <p style="color:#a0a0a0; font-size:13px; line-height:1.6; margin:0;">
                                아래 인증번호를 입력하여 비밀번호를 재설정해주세요.<br>
                                인증번호는 <strong style="color:#ffffff;">3분간</strong> 유효합니다.
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 40px;" align="center">
                              <div style="background-color:#2a2a2a; border:1px solid #3a3a3a; border-radius:6px; padding:24px; display:inline-block;">
                                <span style="color:#ffffff; font-size:32px; font-weight:600; letter-spacing:0.4em;">%s</span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 40px 40px 40px; text-align:center;">
                              <p style="color:#666666; font-size:12px; line-height:1.6; margin:0;">
                                본 메일은 발신 전용입니다.<br>
                                본인이 요청하지 않은 경우 이 메일을 무시해주세요.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(code);
    }
}
