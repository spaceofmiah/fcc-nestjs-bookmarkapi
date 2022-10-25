import {Injectable} from '@nestjs/common';
import {AuthDto} from './dto';
import {PrismaService} from '../prisma/prisma.service';

import * as argon from 'argon2';

@Injectable()
export class AuthService {

	constructor(private prisma:PrismaService) {}

	async signup(dto: AuthDto){
		// generate password hash
		const hash = await argon.hash(dto.password)

		// save new user in the db
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
	}

	signin(){
		return {
			'message': 'Successful signed in'
		}
	}
}