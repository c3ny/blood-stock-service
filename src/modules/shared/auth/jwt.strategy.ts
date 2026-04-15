import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  id: string;
  email: string;
  personType: string;
  companyId: string | null;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  personType: string;
  companyId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload.id) {
      throw new UnauthorizedException('Invalid token: missing user id');
    }
    if (payload.personType === 'COMPANY' && !payload.companyId) {
      throw new UnauthorizedException('Invalid token: COMPANY missing companyId');
    }
    return {
      userId: payload.id,
      email: payload.email,
      personType: payload.personType,
      companyId: payload.companyId,
    };
  }
}