import {Injectable, ForbiddenException} from '@nestjs/common';
import {Prisma, PrismaClient} from '@prisma/client'
import {PrismaService} from '../prisma/prisma.service';
import {AuthDto} from './dto';

import * as argon from 'argon2';

@Injectable()
export class AuthService {

	constructor(private prisma:PrismaService) {}

	async signup(dto: AuthDto){
		// generate password hash
		const hash = await argon.hash(dto.password)

		// save new user in the db
		try {
			const user = await this.prisma.user.create({
				data: {
					email: dto.email,
					hash,
				}
			})

			// don't include the generated hash
			delete user.hash;

			// return the user
			return user;
		} catch ( error ){
			if (error instanceof Prisma.PrismaClientKnownRequestError ) {
				if (error.code === 'P2002') {
					throw new ForbiddenException('Credentials taken');
				}
			}

			throw error;
		}
	}

	signin(){
		return {
			'message': 'Successful signed in'
		}
	}
}