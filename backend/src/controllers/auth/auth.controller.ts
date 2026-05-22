import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { Public } from '../../decorators/public.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RegisterCompanyDto } from '../../dtos/auth/register-company.dto';
import { LoginDto } from '../../dtos/auth/login.dto';
import { RegisterCompanyService } from '../../services/auth/register-company.service';
import { LoginService } from '../../services/auth/login.service';
import { RefreshTokenService } from '../../services/auth/refresh-token.service';
import { LogoutService } from '../../services/auth/logout.service';
import { RequestUser } from '../../types/auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private registerCompanyService: RegisterCompanyService,
    private loginService: LoginService,
    private refreshTokenService: RefreshTokenService,
    private logoutService: LogoutService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterCompanyDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.registerCompanyService.execute(dto);
    return { success: true, data: result, message: 'Company registered successfully' };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.loginService.execute(dto);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { success: true, data: result, message: 'Login successful' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await this.refreshTokenService.execute(refreshToken);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    await this.logoutService.execute(user.id, user.companyId, refreshToken);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { success: true, message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: RequestUser) {
    return { success: true, data: user };
  }
}
