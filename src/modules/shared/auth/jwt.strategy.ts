import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET ?? 'secret',
    });
  }

  validate(payload: { id: string; email: string; personType: string; companyId: string | null }) {
    return {
      userId: payload.id,
      email: payload.email,
      personType: payload.personType,
      companyId: payload.companyId,
    };
  }
}