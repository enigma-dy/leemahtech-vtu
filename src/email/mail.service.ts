import { Injectable, Inject } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { ConfigService } from '@nestjs/config';
import * as ejs from 'ejs';
import * as fs from 'fs';
import { join } from 'path';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class EmailService {
  private readonly baseUrl: string;

  constructor(
    @Inject('SES_CLIENT') private readonly sesClient: SESClient,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
  }

  private async renderTemplate(
    templateName: string,
    context: any,
  ): Promise<string> {
    const templatePath = join(__dirname, 'templates', `${templateName}.ejs`);
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    return ejs.render(templateContent, context);
  }

  private async sendSESEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const from = this.configService.get<string>(
      'MAIL_FROM',
      'no-reply@myco.com.ng',
    );

    const params = {
      Source: `"No Reply" <${from}>`,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      await this.sesClient.send(command);
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email to ${to}`);
    }
  }

  async sendWelcomeEmail(
    to: string,
    name: string,
    token?: string,
  ): Promise<void> {
    const html = await this.renderTemplate('welcome', {
      name,
      email: to,
      token,
    });
    await this.sendSESEmail(to, 'Welcome to Our Platform!', html);
  }

  async sendOpayReciept(
    to: string,
    name: string,
    amount: number,
    txRef: string,
  ): Promise<void> {
    const html = await this.renderTemplate('account-funding', {
      name,
      amount,
      txRef,
    });
    await this.sendSESEmail(to, 'Wallet Top-Up Initiated', html);
  }

  async sendAirtimeReceipt(
    to: string,
    name: string,
    amount: number,
    phone: string,
    txRef: string,
  ): Promise<void> {
    const html = await this.renderTemplate('airtime', {
      name,
      amount,
      phone,
      txRef,
    });
    await this.sendSESEmail(to, 'Airtime Purchase Receipt', html);
  }

  async sendBillPaymentReceipt(
    to: string,
    name: string,
    amount: number,
    disco: string,
    meterNumber: string,
    txRef: string,
  ): Promise<void> {
    const html = await this.renderTemplate('bill-payment', {
      name,
      amount,
      disco,
      meterNumber,
      txRef,
    });
    await this.sendSESEmail(to, 'Electricity Bill Payment Receipt', html);
  }

  async sendCableReceipt(
    to: string,
    name: string,
    cablename: string,
    cableplan: string,
    smartCardNumber: string,
    amount: number,
    txRef: string,
  ): Promise<void> {
    const html = await this.renderTemplate('cable', {
      name,
      cablename,
      cableplan,
      smartCardNumber,
      amount,
      txRef,
    });
    await this.sendSESEmail(to, 'Cable Subscription Receipt', html);
  }

  async sendRechargePinReceipt(
    to: string,
    name: string,
    network: string,
    pinDetails: any,
    amount: number,
    txRef: string,
  ): Promise<void> {
    const html = await this.renderTemplate('recharge-pin', {
      name,
      network,
      pinDetails,
      amount,
      txRef,
    });
    await this.sendSESEmail(to, 'Recharge PIN Purchase Receipt', html);
  }

  async sendExamPinReceipt(
    to: string,
    name: string,
    examName: string,
    pins: any,
    amount: number,
    txRef: string,
  ): Promise<void> {
    const html = await this.renderTemplate('exam-pin', {
      name,
      examName,
      pins,
      amount,
      txRef,
    });
    await this.sendSESEmail(to, 'Exam PIN Purchase Receipt', html);
  }

  async sendDataPurchaseReceipt(
    to: string,
    name: string,
    network: string,
    planName: string,
    planSize: string,
    phone: string,
    amount: Decimal,
    txRef: string,
  ): Promise<void> {
    const html = await this.renderTemplate('data-purchase', {
      name,
      network,
      planName,
      planSize,
      phone,
      amount: amount.toString(),
      txRef,
    });
    await this.sendSESEmail(to, 'Data Purchase Receipt', html);
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string,
  ): Promise<void> {
    const html = await this.renderTemplate('password-reset', {
      name,
      resetLink: `${this.baseUrl}/reset-password?token=${resetToken}`,
    });
    await this.sendSESEmail(to, 'Password Reset Request', html);
  }
}
