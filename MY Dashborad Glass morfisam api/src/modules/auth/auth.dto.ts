import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class EmailDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class SignupDto extends EmailDto {
  @IsString()
  @Length(1, 128)
  password!: string;

  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 100)
  firstName!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone?: string;
}

export class LoginDto extends EmailDto {
  @IsString()
  @Length(1, 128)
  password!: string;
}

export class VerifyOtpDto extends EmailDto {
  @IsString()
  @Matches(/^\d{6}$/)
  otp!: string;
}

export class ResetPasswordDto {
  @IsString()
  @Matches(/^rst_[A-Za-z0-9_-]{43}$/)
  resetToken!: string;

  @IsString()
  @Length(1, 128)
  newPassword!: string;
}
