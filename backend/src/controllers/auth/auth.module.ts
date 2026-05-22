import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtConfig } from '../../config/jwt.config';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '../../services/auth/jwt.strategy';
import { RegisterCompanyService } from '../../services/auth/register-company.service';
import { LoginService } from '../../services/auth/login.service';
import { RefreshTokenService } from '../../services/auth/refresh-token.service';
import { LogoutService } from '../../services/auth/logout.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtConfig.accessTokenSecret,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    RegisterCompanyService,
    LoginService,
    RefreshTokenService,
    LogoutService,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
