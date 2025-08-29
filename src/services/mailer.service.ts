import nodemailer from 'nodemailer';
import { config } from '@/config/app-config';

interface MailAttachmentOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  filename: string;
  content: string;
}

export class MailerService {
  private transporter;

  constructor() {
    const { service, host, port, secure, user, pass } = config.mailer;
    // Prefer explicit SMTP host/port if provided; otherwise use service
    this.transporter = nodemailer.createTransport({
      service: host ? undefined : service,
      host: host || undefined,
      port: host && port ? port : undefined,
      secure: host && typeof secure === 'boolean' ? secure : undefined,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendMailWithAttachment({
    to,
    subject,
    text,
    html,
    filename,
    content,
  }: MailAttachmentOptions) {
    await this.transporter.sendMail({
  from: `"TreeByte" <${config.mailer.user || 'no-reply@treebyte.local'}>`,
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename,
          content,
        },
      ],
    });
  }
}
