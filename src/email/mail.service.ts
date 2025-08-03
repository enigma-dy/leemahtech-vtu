import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Decimal } from 'generated/prisma/runtime/library';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendWelcomeEmail(to: string, name: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Welcome to Our Platform!',
      template: 'welcome',
      context: {
        name,
        email: to,
      },
    });
  }
  async sendOpayReciept(
    to: string,
    name: string,
    amount: number,
    txRef: string,
  ) {
    await this.mailerService.sendMail({
      to,
      subject: 'Wallet Top-Up Initiated',
      template: 'account-funding',
      context: {
        name,
        amount,
        txRef,
      },
    });
  }

  async sendAirtimeReceipt(
    to: string,
    name: string,
    amount: number,
    phone: string,
    txRef: string,
  ) {
    await this.mailerService.sendMail({
      to,
      subject: 'Airtime Purchase Receipt',
      template: 'airtime',
      context: { name, amount, phone, txRef },
    });
  }

  async sendBillPaymentReceipt(
    to: string,
    name: string,
    amount: number,
    disco: string,
    meterNumber: string,
    txRef: string,
  ) {
    await this.mailerService.sendMail({
      to,
      subject: 'Electricity Bill Payment Receipt',
      template: 'bill-payment',
      context: { name, amount, disco, meterNumber, txRef },
    });
  }

  async sendCableReceipt(
    to: string,
    name: string,
    cablename: string,
    cableplan: string,
    smartCardNumber: string,
    amount: number,
    txRef: string,
  ) {
    await this.mailerService.sendMail({
      to,
      subject: 'Cable Subscription Receipt',
      template: 'cable',
      context: { name, cablename, cableplan, smartCardNumber, amount, txRef },
    });
  }

  async sendRechargePinReceipt(
    to: string,
    name: string,
    network: string,
    pinDetails: any,
    amount: number,
    txRef: string,
  ) {
    await this.mailerService.sendMail({
      to,
      subject: 'Recharge PIN Purchase Receipt',
      template: 'recharge-pin',
      context: { name, network, pinDetails, amount, txRef },
    });
  }

  async sendExamPinReceipt(
    to: string,
    name: string,
    examName: string,
    pins: any,
    amount: number,
    txRef: string,
  ) {
    await this.mailerService.sendMail({
      to,
      subject: 'Exam PIN Purchase Receipt',
      template: 'exam-pin',
      context: { name, examName, pins, amount, txRef },
    });
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
  ) {
    await this.mailerService.sendMail({
      to,
      subject: 'Data Purchase Receipt',
      template: 'data-purchase',
      context: { name, network, planName, planSize, phone, amount, txRef },
    });
  }
}
