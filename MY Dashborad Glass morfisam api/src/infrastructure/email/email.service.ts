import { Injectable, OnModuleDestroy } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { AppConfig } from '../../config/app-config';

export interface OtpEmail {
  to: string;
  code: string;
  purpose: 'SIGNUP' | 'FORGOT_PASSWORD';
  deliveryKey: string;
}

@Injectable()
export class EmailService implements OnModuleDestroy {
  private transport?: Transporter;

  constructor(private readonly config: AppConfig) {}

  async sendOtp(message: OtpEmail): Promise<void> {
    const cfg = this.config.values;
    const subject = message.purpose === 'SIGNUP' ? 'Verify your email' : 'Reset your password';
    // Keep content identical across retries so provider idempotency keys stay valid.
    const text = `${subject}\n\nYour verification code is ${message.code}.\n\nThis code expires shortly. If you did not request it, you can ignore this email.`;
    try {
      if (cfg.emailProvider === 'resend') {
        if (!cfg.resendApiKey) throw new Error('EMAIL_NOT_CONFIGURED');
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfg.resendApiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': message.deliveryKey,
          },
          body: JSON.stringify({ from: cfg.smtpFrom, to: [message.to], subject, text }),
          signal: AbortSignal.timeout(cfg.emailTimeoutMs),
        });
        // Do not parse or log provider errors; those can echo email bodies.
        await response.body?.cancel();
        if (!response.ok) throw new Error('EMAIL_PROVIDER_REJECTED');
        return;
      }
      if (!cfg.smtpHost) throw new Error('EMAIL_NOT_CONFIGURED');
      this.transport ??= nodemailer.createTransport({
        host: cfg.smtpHost, port: cfg.smtpPort, secure: cfg.smtpSecure,
        requireTLS: cfg.production && !cfg.smtpSecure,
        auth: cfg.smtpUser ? { user: cfg.smtpUser, pass: cfg.smtpPassword } : undefined,
        connectionTimeout: cfg.emailTimeoutMs,
        greetingTimeout: cfg.emailTimeoutMs,
        socketTimeout: cfg.emailTimeoutMs,
        logger: false, debug: false,
        disableFileAccess: true, disableUrlAccess: true,
      });
      await this.transport.sendMail({
        from: cfg.smtpFrom, to: message.to, subject, text,
        messageId: `<${message.deliveryKey}@auth.local>`,
      });
    } catch {
      // BullMQ persists thrown messages/stacks in Redis. Never forward provider errors.
      throw new Error('EMAIL_DELIVERY_FAILED');
    }
  }

  onModuleDestroy(): void {
    this.transport?.close();
  }
}
