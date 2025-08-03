import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class LeemahService {
  constructor(private readonly httpService: HttpService) {}

  async getDataPricing(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          'https://www.leemahtelecoms.com/api/get/network/',
          {
            headers: {
              Authorization: `Token ${process.env.LEEMAH_API_KEY}`,
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Error fetching data from Leemah';
      const status = error?.response?.status || 500;
      throw new InternalServerErrorException({ status, message });
    }
  }
}
