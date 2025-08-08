import { Decimal } from 'generated/prisma/runtime/library';

export class EmailEvent {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly meta?: Record<string, any>,
  ) {}
}

export class OpayEvent {
  constructor(
    public readonly to: string,
    public readonly name: string,
    public readonly amount: number,
    public readonly txRef: string,
  ) {}
}

export class DataPurchaseEvent {
  constructor(
    public readonly to: string,
    public readonly name: string,
    public readonly network: string,
    public readonly planName: string,
    public readonly planSize: string,
    public readonly phone: string,
    public readonly amount: Decimal,
    public readonly txRef: string,
  ) {}
}
