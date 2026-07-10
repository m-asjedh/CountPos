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
  BadRequestException,
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
import type { ApiResponse } from '../../common/interceptors/response.interceptor';

function getRequestCookie(req: Request, name: string): string | undefined {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[name];
  return typeof value === 'string' ? value : undefined;
}

function getRefreshTokenFromRequest(req: Request): string | undefined {
  const fromCookie = getRequestCookie(req, 'refreshToken');
  if (fromCookie) return fromCookie;

  const body = req.body as { refreshToken?: unknown } | undefined;
  return typeof body?.refreshToken === 'string' ? body.refreshToken : undefined;
}

const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none' as const,
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

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
  async register(
    @Body() dto: RegisterCompanyDto,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.registerCompanyService.execute(dto);
    return {
      success: true,
      data: result,
      message: 'Company registered successfully',
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.loginService.execute(dto);

    res.cookie('accessToken', result.accessToken, accessCookieOptions);
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

    return { success: true, data: result, message: 'Login successful' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<unknown>> {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      throw new BadRequestException('Refresh token required');
    }

    const result = await this.refreshTokenService.execute(refreshToken);

    res.cookie('accessToken', result.accessToken, accessCookieOptions);

    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<undefined>> {
    const refreshToken = getRequestCookie(req, 'refreshToken');
    await this.logoutService.execute(user.id, user.companyId, refreshToken);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { success: true, message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: RequestUser): ApiResponse<RequestUser> {
    return { success: true, data: user };
  }
}
