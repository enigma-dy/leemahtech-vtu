import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as qs from 'qs';

// @Injectable()
// export class FlutterwaveAuthService implements OnModuleInit {
//   private accessToken: string | null = null;
//   private expiresIn = 0;
//   private lastTokenRefreshTime = 0;

//   constructor(private readonly httpService: HttpService) {}

//   async onModuleInit() {
//     setInterval(() => this.ensureTokenIsValid(), 5000);
//   }

//   private async refreshToken(): Promise<void> {
//     try {
//       const response = await firstValueFrom(
//         this.httpService.post(
//           process.env.FLUTTER_AUTH_URL as string,
//           qs.stringify({
//             client_id: process.env.FLUTTER_CLIENT_ID,
//             client_secret: process.env.CLIENT_SECRET,
//             grant_type: process.env.GRANT_TYPE,
//           }),
//           {
//             headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//           },
//         ),
//       );

//       this.accessToken = response.data.access_token;
//       this.expiresIn = response.data.expires_in;
//       this.lastTokenRefreshTime = Date.now();

//       console.log('New token fetched.');
//     } catch (error: any) {
//       console.error(
//         'Error refreshing token:',
//         error.response?.data || error.message,
//       );
//     }
//   }

//   private async ensureTokenIsValid(): Promise<void> {
//     const currentTime = Date.now();
//     const timeSinceLastRefresh =
//       (currentTime - this.lastTokenRefreshTime) / 1000;
//     const timeLeft = this.expiresIn - timeSinceLastRefresh;

//     if (!this.accessToken || timeLeft < 60) {
//       console.log('Refreshing Flutterwave token...');
//       await this.refreshToken();
//     } else {
//       console.log(`Token still valid for ${Math.floor(timeLeft)} seconds.`);
//     }
//   }

//   public async getAccessToken(): Promise<string> {
//     await this.ensureTokenIsValid();
//     return this.accessToken!;
//   }
// }
