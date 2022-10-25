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

	async signin(dto: AuthDto){

		// find user by email
		const user = await this.prisma.user.findUnique({
			where: { email: dto.email }
		})

		// if user doesn't exist throw exception
		if (!user) throw new ForbiddenException('Credentials incorrect');

		// compare password
		const pwMatches = await argon.verify(user.hash, dto.password);

		// if incorrect password throw exception
		if (!pwMatches) throw new ForbiddenException('Credentials incorrect');

		// send back user
		delete user.hash
		return user
	}
}