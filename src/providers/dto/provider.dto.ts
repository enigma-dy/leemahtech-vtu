import { IsEnum } from 'class-validator';

export enum SmeProvider {
  DATASTATION = 'datastation',
  HUSMODATA = 'husmodata',
  DIRECT = 'direct',
}

export class SetSmeProviderDto {
  @IsEnum(SmeProvider, {
    message: 'Provider must be either datastation or husmodata',
  })
  provider: SmeProvider;
}
