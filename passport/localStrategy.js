/*jshint esversion: 6 */

const LocalStrategy = require('passport-local').Strategy;   //local 모듈에서 strategy 생성자를 불러와 사용합니다.
const bcrypt = require('bcrypt');

const { User } = require('../models');

module.exports = (passport) => {
	passport.use(new LocalStrategy({
		usernameField: 'email',         // 전략에 관한 설정.LocalStrategy 첫 번째 인자로 들어갑니다. usernameField와 passwordField는 일치하는 req.body의 속성명을 적어줍니다. 
		passwordField: 'password',
	}, async (email, password, done) => {   //실제 전략을 수행. LocalStrategy 두 번째 인자로 들어갑니다. 위에서 넣어준 email과 password가 1,2번째 매개변수가 됩니다.
		try { 							 	//3번째 done 함수는 passport.authenticate의 콜백 함수입니다.
			const exUser = await User.find({ where: { email }});
			if(exUser) {                    //User.find로 일치하는 이메일을 찾은 후, 
				const result = await bcrypt.compare(password, exUser.password);  // 있다면 bcrypt의 compare 함수로 비밀번호를 비교합니다.
				if(result) {
					done(null, exUser);  //비밀번호까지 일치했다면 done 함수의 두 번째 인자로 사용자 정보를 넣어 보냅니다. done 함수의 첫번째 인자는 서버쪽 에러, 두번째 인자는 성공, 세번째는 처리과정에서 
				} else { 				//비밀번호가 일치하지 않거나 존재하지 않는 회원일 때입니다.
					done(null, false, { message: '비밀번호가 일치하지 않습니다.'});
				}
			} else {
				done(null, false, { message : '가입되지 않은 회원입니다.'});
			}
		} catch (error) {
			console.error(error);
			done(error);
		}
	}));
};