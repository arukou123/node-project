/*jshint esversion: 6 */

const express = require('express');

const { isLoggedIn } = require('./middlewares');
const { User } = require('../models');

const router = express.Router();

//---------------------팔로우---------------------------
router.post('/:id/follow', isLoggedIn, async (req, res, next) => {    //사용자를 팔로우 할 수 있다. :id 부분이 req.params.id이다.
	console.log("팔로잉 들어옴");
	try {
		const user = await User.find({ where: { id: req.user.id } });     //먼저 팔로우 할 사용자를 데이터베이스에서 조회한 후
		console.log("유저: " + req.user.id);    //로그인한 아이디
		await user.addFollowing(parseInt(req.params.id, 10));          //시퀄라이즈에서 추가한 addFollowing 메서드로 현재 로그인한 사용자와의 관계를 지정한다.
		console.log("유저라우트: " + parseInt(req.params.id));   //로그인한 계정이 팔로우 걸은 아이디
		res.send('success');
	} catch(error) {
		console.error(error);
		next(error);
	}
});

//---------------------언팔로우---------------------------
router.post('/:id/unfollow', isLoggedIn, async (req, res, next) => {    
	console.log("언팔로잉 들어옴");
	try {
		const user = await User.find({ where: { id: req.user.id } });     
		console.log("유저: " + req.user.id);   
		await user.removeFollowing(parseInt(req.params.id, 10));      //자동으로 팔로잉 관계를 끊는 sql문을 짜줌    
		console.log("유저라우트: " + parseInt(req.params.id));  
		res.send('success');
	} catch(error) {
		console.error(error);
		next(error);
	}
});


//----------------------사용자 닉네임 프로필 수정------------------------
router.post('/profile', async (req, res, next) => {
	try{
	await User.update({ nick: req.body.nick }, {
		where : {id: req.user.id }, 
	});
	res.redirect('/profile');
	} catch (error) {
		console.error(error);
		next(error);
	}
});

module.exports = router;