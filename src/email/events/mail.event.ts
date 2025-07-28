export class EmailEvent {
  constructor(
    public readonly email: string,
    public readonly name: string,
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
