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

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final NumberFormat KRW = NumberFormat.getNumberInstance(Locale.KOREA);

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

    @Async
    public void sendPaymentConfirmEmail(OrderEmailContext ctx) {
        send(ctx.email(),
                "[SHOPIFY] 주문이 결제되었습니다 (" + ctx.orderNumber() + ")",
                buildPaymentConfirmHtml(ctx),
                "결제 완료 이메일");
    }

    @Async
    public void sendShippedEmail(OrderEmailContext ctx) {
        send(ctx.email(),
                "[SHOPIFY] 주문하신 상품이 발송되었습니다 (" + ctx.orderNumber() + ")",
                buildShippedHtml(ctx),
                "배송 시작 이메일");
    }

    @Async
    public void sendAdminCancelEmail(OrderEmailContext ctx) {
        send(ctx.email(),
                "[SHOPIFY] 주문이 취소되었습니다 (" + ctx.orderNumber() + ")",
                buildAdminCancelHtml(ctx),
                "관리자 취소 이메일");
    }

    private void send(String to, String subject, String html, String label) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("{} 발송 완료: {}", label, to);
        } catch (MessagingException | RuntimeException e) {
            log.error("{} 발송 실패: {}", label, to, e);
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

    private String buildPaymentConfirmHtml(OrderEmailContext ctx) {
        String greeting = "%s님, 주문이 정상적으로 결제되었습니다.".formatted(escape(ctx.recipientName()));
        String body = """
                %s
                %s
                <tr><td style="padding:8px 0; color:#a0a0a0; font-size:13px;">결제 금액</td>
                    <td style="padding:8px 0; color:#ffffff; font-size:13px; text-align:right;">%s원</td></tr>
                %s
                %s
                """.formatted(
                itemsRows(ctx),
                divider(),
                krw(ctx.finalAmount()),
                couponRow(ctx),
                shippingRow(ctx)
        );
        return wrap("주문 결제 완료", greeting, body);
    }

    private String buildShippedHtml(OrderEmailContext ctx) {
        String greeting = "%s님, 주문하신 상품이 발송되었습니다.".formatted(escape(ctx.recipientName()));
        String carrierText = isBlank(ctx.carrier()) ? "준비 중" : escape(ctx.carrier());
        String trackingText = isBlank(ctx.trackingNumber()) ? "준비 중" : escape(ctx.trackingNumber());
        String body = """
                <tr><td style="padding:8px 0; color:#a0a0a0; font-size:13px;">주문번호</td>
                    <td style="padding:8px 0; color:#ffffff; font-size:13px; text-align:right;">%s</td></tr>
                <tr><td style="padding:8px 0; color:#a0a0a0; font-size:13px;">배송사</td>
                    <td style="padding:8px 0; color:#ffffff; font-size:13px; text-align:right;">%s</td></tr>
                <tr><td style="padding:8px 0; color:#a0a0a0; font-size:13px;">운송장번호</td>
                    <td style="padding:8px 0; color:#ffffff; font-size:13px; text-align:right;">%s</td></tr>
                %s
                """.formatted(escape(ctx.orderNumber()), carrierText, trackingText, shippingRow(ctx));
        return wrap("배송 시작", greeting, body);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private String buildAdminCancelHtml(OrderEmailContext ctx) {
        String greeting = "%s님, 주문이 관리자에 의해 취소되었습니다.".formatted(escape(ctx.recipientName()));
        String body = """
                %s
                %s
                <tr><td style="padding:8px 0; color:#a0a0a0; font-size:13px;">환불 예정 금액</td>
                    <td style="padding:8px 0; color:#ffffff; font-size:13px; text-align:right;">%s원</td></tr>
                <tr><td colspan="2" style="padding-top:16px; color:#666666; font-size:12px; line-height:1.6;">
                  환불은 결제 수단의 영업일 기준 처리 일정에 따라 진행됩니다.
                </td></tr>
                """.formatted(itemsRows(ctx), divider(), krw(ctx.finalAmount()));
        return wrap("주문 취소", greeting, body);
    }

    private String wrap(String title, String greeting, String tableRows) {
        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="margin:0; padding:0; background-color:#2a2a2a; font-family:'Helvetica Neue',Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#2a2a2a; padding:40px 0;">
                    <tr><td align="center">
                      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#1e1e1e; border-radius:8px; overflow:hidden;">
                        <tr><td style="padding:40px 40px 16px 40px; text-align:center;">
                          <h1 style="color:#ffffff; font-size:20px; letter-spacing:0.2em; font-weight:300; margin:0;">SHOPIFY</h1>
                        </td></tr>
                        <tr><td style="padding:0 40px 16px 40px; text-align:center;">
                          <h2 style="color:#ffffff; font-size:16px; font-weight:400; margin:0 0 8px 0;">%s</h2>
                          <p style="color:#a0a0a0; font-size:13px; line-height:1.6; margin:0;">%s</p>
                        </td></tr>
                        <tr><td style="padding:8px 40px 32px 40px;">
                          <table width="100%%" cellpadding="0" cellspacing="0" style="border-top:1px solid #3a3a3a;">
                            %s
                          </table>
                        </td></tr>
                        <tr><td style="padding:0 40px 32px 40px; text-align:center;">
                          <p style="color:#666666; font-size:12px; line-height:1.6; margin:0;">
                            본 메일은 발신 전용입니다.
                          </p>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(escape(title), greeting, tableRows);
    }

    private String itemsRows(OrderEmailContext ctx) {
        StringBuilder sb = new StringBuilder();
        for (OrderEmailContext.Line line : ctx.items()) {
            String optionLine = line.optionInfo() == null || line.optionInfo().isBlank() || "FREE".equals(line.optionInfo())
                    ? ""
                    : "<div style=\"color:#a0a0a0; font-size:12px; margin-top:4px;\">" + escape(line.optionInfo()) + "</div>";
            sb.append("""
                    <tr>
                      <td style="padding:12px 0; color:#ffffff; font-size:13px;">
                        %s
                        %s
                        <div style="color:#a0a0a0; font-size:12px; margin-top:4px;">수량 %d</div>
                      </td>
                      <td style="padding:12px 0; color:#ffffff; font-size:13px; text-align:right; vertical-align:top;">
                        %s원
                      </td>
                    </tr>
                    """.formatted(escape(line.productName()), optionLine, line.quantity(), krw(line.subtotal())));
        }
        return sb.toString();
    }

    private String couponRow(OrderEmailContext ctx) {
        if (ctx.couponName() == null || ctx.couponDiscountAmount() == null
                || ctx.couponDiscountAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return "";
        }
        return """
                <tr>
                  <td style="padding:8px 0; color:#a0a0a0; font-size:13px;">쿠폰 할인 (%s)</td>
                  <td style="padding:8px 0; color:#ffffff; font-size:13px; text-align:right;">-%s원</td>
                </tr>
                """.formatted(escape(ctx.couponName()), krw(ctx.couponDiscountAmount()));
    }

    private String shippingRow(OrderEmailContext ctx) {
        return """
                <tr><td colspan="2" style="padding-top:16px;">
                  <div style="color:#a0a0a0; font-size:13px; margin-bottom:4px;">배송지</div>
                  <div style="color:#ffffff; font-size:13px; line-height:1.6;">
                    %s (%s)<br>%s
                  </div>
                </td></tr>
                """.formatted(escape(ctx.shippingRecipient()), escape(ctx.shippingPhone()), escape(ctx.shippingAddress()));
    }

    private String divider() {
        return "<tr><td colspan=\"2\" style=\"border-top:1px solid #3a3a3a; padding:0;\"></td></tr>";
    }

    private static String krw(BigDecimal amount) {
        return amount == null ? "0" : KRW.format(amount);
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
