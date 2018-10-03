/*jshint esversion: 6 */

const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Comment, Post, User} = require('../models');    //메인 페이지 로딩 시 메인 페이지와 게시글을 함께 로딩
const router = express.Router();

router.post('/:id/content/:param', isLoggedIn,  async (req, res, next) => {
	try {
		console.log("넘어오긴 함" + req.params.id);
		const commentPost = await Comment.create({
			content: req.params.param,
			userId: req.user.id,
			postId: req.params.id,
			commenter: req.user.nick,
		});
		res.send('ok');
	} catch(error) {
		console.error(error);
		next(error);
	}
});

router.delete('/:id', async(req, res, next) => {
	try{
		await Comment.destroy({ where: {id: req.params.id}});
		res.send('OK');
	} catch(error){
		console.error(error);
		next(error);
	}
})

module.exports = router;