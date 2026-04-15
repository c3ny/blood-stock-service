import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class InternalSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-internal-secret'];
    const expected = process.env.INTERNAL_SECRET;

    if (!expected) {
      throw new UnauthorizedException('Internal secret not configured');
    }
    if (typeof provided !== 'string') {
      throw new UnauthorizedException('Invalid internal secret');
    }

    const providedBuf = Buffer.from(provided);
    const expectedBuf = Buffer.from(expected);
    if (
      providedBuf.length !== expectedBuf.length ||
      !timingSafeEqual(providedBuf, expectedBuf)
    ) {
      throw new UnauthorizedException('Invalid internal secret');
    }

    return true;
  }
}
