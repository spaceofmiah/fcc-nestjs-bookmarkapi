import {Injectable} from '@nestjs/common';


@Injectable({})
export class AuthService {

	signup(){
		return {
			'message': 'Successfully signed up'
		}
	}

	signin(){
		return {
			'message': 'Successful signed in'
		}
	}
}