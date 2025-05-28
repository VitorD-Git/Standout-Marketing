import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

export interface GoogleProfile {
  id: string;
  email: string;
  displayName: string;
  photos?: { value: string }[];
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    
    if (!emails || !emails[0]) {
      return done(new UnauthorizedException('No email found'), null);
    }

    const email = emails[0].value;
    const allowedDomain = this.configService.get('ALLOWED_DOMAIN');
    
    // Validate domain restriction
    const emailDomain = email.split('@')[1];
    if (allowedDomain && emailDomain !== allowedDomain) {
      return done(
        new UnauthorizedException(
          `Access restricted to ${allowedDomain} domain`
        ),
        null
      );
    }

    const user: GoogleProfile = {
      id,
      email,
      displayName: `${name.givenName} ${name.familyName}`,
      photos,
    };

    return done(null, user);
  }
}