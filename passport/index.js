/*jshint esversion: 6 */

const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const { User } = require('../models');

module.exports = (passport) => {   //serializeUser와 deserializeUser가 passport의 핵심.
	passport.serializeUser((user, done) => {   //req.session 객체에 어떤 데이터를 저장할지 선택합니다.매개변수로 user을 받아, 
		done(null, user.id);				//done 함수의 두 번째 인자로 user.id를 넘기고 있습니다. 첫 번째 인자는 에러 발생 시 사용하는 것이라 두 번째가 중요합니다.
	});										//세션에 사용자 정보를 모두 저장하면 데이터 일관성에 문제가 생기고 세션이 비대해지므로 사용자의 아이디만 저장하라고 명령.
	
	
	passport.deserializeUser((id, done) => {  //매 요청 시 실행됨. app.js의 passport.session() 미들웨어가 이 메서드를 호출합니다.
		User.find({ 							//serializeUser에서 세션에 저장했던 아이디를 받아 데이터베이스에서 사용자 정보를 조회합니다.
			where: { id } ,         
			include: [{                        //세션에 저장된 아이디로 사용자 정보를 조회할 때, 팔로잉 목록과 팔로워 목록도 같이 조회합니다.
				model: User, 
				attributes: ['id', 'nick'],         //attributes는 실수로 비밀번호를 조회하는 것을 방지
				as: 'Followers',
			}, {
				model: User,                          //자신이 팔로잉 한 목록과 팔로워 한 목록을 조회하는 것인듯.
				attributes: ['id', 'nick'],
				as: 'Followings',
			}],
		})		
			.then(user => done(null, user))  //조회한 정보를 req.user에 저장하므로 앞으로 req.user을 통해 로그인한 사용자 정보를 가져올 수 있습니다.
			.catch(err => done(err));
	});
	
	local(passport);
	kakao(passport);
};