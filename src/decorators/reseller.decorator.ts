import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ResellerGuard } from 'src/reseller/reseller.guard';

export const IS_RESELLER_KEY = 'isReseller';

export function ResellerRoute() {
  return applyDecorators(
    SetMetadata(IS_RESELLER_KEY, true),
    UseGuards(ResellerGuard),
  );
}
