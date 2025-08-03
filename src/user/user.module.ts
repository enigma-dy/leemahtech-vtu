import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { EmailModule } from 'src/email/mailer.module';

@Module({
  providers: [UserService, EmailModule],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
