/*jshint esversion: 6 */

const KakaoStrategy = require('passport-kakao').Strategy;

const { User } = require('../models');

module.exports = (passport) => {
	passport.use(new KakaoStrategy({      //로컬 전략과 마찬가지로 카카오 로그인에 대한 설정.  clientID는 카카오에서 발급해주는 ID. 노출되면 안되서 dotenv를 사용.
		clientID: process.env.KAKAO_ID,
		callbackURL: '/auth/kakao/callback',          //카카오로부터 인증 결과를 받을 라우터 주소.
	}, async (accessToken, refreshToken, profile, done) => {
		try{
			const exUser = await User.find({ where: { snsId: profile.id, provider: 'kakao'} });
			console.log("exuser: " + exUser);
			if(exUser) {
				done(null, exUser);    //먼저 카카오로 로그인한 사용자가 있는지 조회. 있으면  done콜백.
			} else {
			const newUser = await User.create({
				 email: profile._json && profile._json.kaccount_email,  //없다면 회원가입. 카카오에서는 callbackURL에 적힌 주소로 accessToken, refreshToken과
				nick: profile.displayName,                      //profile을 보내줍니다. profile에 사용자 정보가 있음. profile 객체에서 원하는 정보를 뽑아 회원가입.
				snsId: profile.id,
				provider: 'kakao',
			});
			done(null, newUser);
		}
	} catch(error) {
		done(error);
		console.error(error);
	}
	}));
};