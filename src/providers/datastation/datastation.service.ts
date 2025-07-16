import { HttpService } from '@nestjs/axios';
import { Body, Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DataStationDto } from './dto/datastation.dto';

@Injectable()
export class DataStationService {
  constructor(private readonly httpService: HttpService) {}

  async getDataPricing(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://datastationapi.com/api/get/network/', {
          headers: {
            Authorization: `Token ${process.env.DataStation_API_KEY}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Error fetching data from DataStation';
      const status = error?.response?.status || 500;
      throw new InternalServerErrorException({ status, message });
    }
  }

  async buyData(data: DataStationDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('https://datastationapi.com/api/data/', data, {
          headers: {
            Authorization: `Token ${process.env.DataStation_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('DataStation API Error:', {
        message: error?.message,
        responseData: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });

      throw error;
    }
  }
}
