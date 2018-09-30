/*jshint esversion: 6 */
//나중에 app.js와 연결할 때 /auth 접두사를 붙일 것이므로 주소는 각각 /auth/join , /auth/login, /auth/logout이 됩니다.
const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User } = require('../models');

const router = express.Router();


router.post('/join', isNotLoggedIn, async (req, res, next) => {   //회원가입 라우터. async await 형식 사용
  const { email, nick, password } = req.body;            //req.body에서 email, nick, password를 추출
  try {
    const exUser = await User.find({ where: { email } });   //await는 ~가 될때까지 기다리겠다는 뜻.   User.find로 데이터베이스에 email이 같은게 있는지 검색후 다음으로 진행
    if (exUser) {     //같은게 있으면 flash 메세지를 설정하고 회원가입 페이지로
      req.flash('joinError', '이미 가입된 이메일입니다.');
      return res.redirect('/join');
    }
    const hash = await bcrypt.hash(password, 12);      //비밀번호는 암호화해서 저장. bcrypt 모듈 사용. bcryp의 hash 메서드를 사용해 손쉽게 암호화. 
    await User.create({									//12는 반복횟수. 12 이상을 추천. 31까지 가능
      email,
      nick,
      password: hash,
    });
    return res.redirect('/page/1');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});



router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => { //authenticate('local')이 로컬 로그인 전략을 수행합니다. 미들웨어인데 라우터 미들웨어 안에 들어옴.
    if (authError) {		//이럴 때는 내부 미들웨어에 (req, res, next)를 인자로 제공해서 호출하면 됨.
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      req.flash('loginError', info.message);
      return res.redirect('/');
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect('/page/1');
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get('/logout', isLoggedIn, (req, res) => {     //req.user 객체를 제거하고 session 객체의 내용을 제거함.
  req.logout();
  req.session.destroy();
  res.redirect('/page/1');
});


router.get('/kakao', passport.authenticate('kakao'));  //일로 접근하면 카카오 로그인 과정이 시작됨.  layout.pug의 카카오톡 버튼에 /auth/kakao 링크가 있dma.
													//get auth/kakao에서 카카오 로인 창으로 리다이렉트를 하고, 결과를 /kakao/callback으로 받습니다.

router.get('/kakao/callback', passport.authenticate('kakao', {   //카카오 로그인 전략을 수행. 로컬과 다른 점은 authenticate 메서드에 콜백 함수를 제공하지 않음
  failureRedirect: '/page/1',             //카카오 로그인은 내부적으로 req.login을 호출하므로 우리가 직접 하출할 필요가 없습니다. 대신에 로그인 실패 시 어디로 이동할지를 failureRedirect 속성에 적고
}), (req, res) => {
  res.redirect('/page/1');                //성공 시의 redirect도 적어줍니다.
});

module.exports = router;
