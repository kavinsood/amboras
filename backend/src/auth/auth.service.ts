import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { LoginDto } from '../common/dto/login.dto';
import { DbService } from '../db/db.service';

interface LoginRow {
  user_id: string;
  email: string;
  password_hash: string;
  store_id: string;
  store_name: string;
  timezone: string;
  currency: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DbService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const result = await this.db.query<LoginRow>(
      `
        SELECT
          users.id AS user_id,
          users.email,
          users.password_hash,
          stores.id AS store_id,
          stores.name AS store_name,
          stores.timezone,
          stores.currency
        FROM users
        INNER JOIN store_memberships
          ON store_memberships.user_id = users.id
        INNER JOIN stores
          ON stores.id = store_memberships.store_id
        WHERE users.email = $1
        LIMIT 1
      `,
      [dto.email.toLowerCase()],
    );

    const row = result.rows[0];
    if (!row) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, row.password_hash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: row.user_id,
      email: row.email,
      storeId: row.store_id,
      storeName: row.store_name,
      timezone: row.timezone,
      currency: row.currency,
    });

    return {
      accessToken,
      user: {
        id: row.user_id,
        email: row.email,
      },
      store: {
        id: row.store_id,
        name: row.store_name,
        timezone: row.timezone,
        currency: row.currency,
      },
    };
  }
}
