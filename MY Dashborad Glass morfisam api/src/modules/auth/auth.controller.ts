import { Body, Controller, Get, Headers, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { CookieOptions, Response } from 'express';
import { AppConfig } from '../../config/app-config';
import { ApiError } from '../../common/errors/api-error';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ApiRequest } from '../../common/http/request-context';
import { UsersService } from '../users/users.service';
import { AuthContext, AuthIdentity, AuthService, SessionResult } from './auth.service';
import { EmailDto, LoginDto, ResetPasswordDto, SignupDto, VerifyOtpDto } from './auth.dto';

const REFRESH_COOKIE = 'glass_refresh';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly users: UsersService, private readonly config: AppConfig) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto, @Headers('idempotency-key') key: string | undefined, @Req() request: ApiRequest) {
    return { success: true, data: await this.auth.signup(dto, key, this.context(request)) };
  }

  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body() dto: VerifyOtpDto, @Headers('idempotency-key') key: string | undefined, @Req() request: ApiRequest) {
    return { success: true, data: await this.auth.verifyEmail(dto, key, this.context(request)) };
  }

  @Post('resend-verification')
  @HttpCode(200)
  async resendVerification(@Body() dto: EmailDto, @Headers('idempotency-key') key: string | undefined, @Req() request: ApiRequest) {
    return { success: true, data: await this.auth.resendVerification(dto, key, this.context(request)) };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() request: ApiRequest, @Res({ passthrough: true }) response: Response) {
    return this.setSession(await this.auth.login(dto, this.context(request)), response);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() request: ApiRequest, @Res({ passthrough: true }) response: Response) {
    const cookies: unknown = request.cookies;
    const value: unknown = cookies && typeof cookies === 'object' && REFRESH_COOKIE in cookies ? cookies[REFRESH_COOKIE] : undefined;
    try {
      return this.setSession(await this.auth.refresh(typeof value === 'string' ? value : undefined, this.context(request)), response);
    } catch (error) {
      if (error instanceof ApiError && error.getStatus() === 401) response.clearCookie(REFRESH_COOKIE, this.cookieOptions());
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async logout(@Req() request: ApiRequest, @Res({ passthrough: true }) response: Response) {
    const data = await this.auth.logout(this.identity(request), this.context(request));
    response.clearCookie(REFRESH_COOKIE, this.cookieOptions());
    return { success: true, data };
  }

  @Post('logout-all')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async logoutAll(@Req() request: ApiRequest, @Res({ passthrough: true }) response: Response) {
    const data = await this.auth.logout(this.identity(request), this.context(request), true);
    response.clearCookie(REFRESH_COOKIE, this.cookieOptions());
    return { success: true, data };
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: EmailDto, @Headers('idempotency-key') key: string | undefined, @Req() request: ApiRequest) {
    return { success: true, data: await this.auth.forgotPassword(dto, key, this.context(request)) };
  }

  @Post('verify-reset-otp')
  @HttpCode(200)
  async verifyResetOtp(@Body() dto: VerifyOtpDto, @Headers('idempotency-key') key: string | undefined, @Req() request: ApiRequest) {
    return { success: true, data: await this.auth.verifyResetOtp(dto, key, this.context(request)) };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto, @Headers('idempotency-key') key: string | undefined, @Req() request: ApiRequest) {
    return { success: true, data: await this.auth.resetPassword(dto, key, this.context(request)) };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() request: ApiRequest) {
    return { success: true, data: await this.users.me(this.identity(request).userId) };
  }

  private context(request: ApiRequest): AuthContext {
    return { requestId: request.requestId, ipAddress: request.ip, userAgent: request.headers['user-agent'] };
  }

  private identity(request: ApiRequest): AuthIdentity {
    if (!request.auth) throw new ApiError(401, 'UNAUTHORIZED', 'Please sign in again.');
    return request.auth;
  }

  private cookieOptions(): CookieOptions {
    return { httpOnly: true, secure: this.config.values.production, sameSite: 'strict', path: '/api/v1/auth' };
  }

  private setSession(result: SessionResult, response: Response) {
    response.cookie(REFRESH_COOKIE, result.refreshToken, { ...this.cookieOptions(), maxAge: this.config.values.refreshTokenTtlSeconds * 1000 });
    return { success: true, data: result.data };
  }
}
