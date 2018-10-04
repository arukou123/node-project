/*jshint esversion: 6 */

const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User, Hashtag, Comment } = require('../models');    //메인 페이지 로딩 시 메인 페이지와 게시글을 함께 로딩
const sequelize = require("sequelize");
const Op = sequelize.Op;
const router = express.Router();

router.get('/profile', isLoggedIn, (req, res) => {   //middlewares.js가 true를 반환해야 res.render로 넘어감
	res.render('profile', { 
		 title: '내 정보 - NodeBird', user: req.user
	});
});

router.get('/join',isNotLoggedIn, (req, res) => {
	res.render('join', {
		title: '회원가입 - NodeBird',
		user: req.user,       //pug에서 user 객체를 통해 사용자 정보에 접근할 수 있게 되었다.
		joinError: req.flash('joinError'),  //에러 메세지를 보여주기 위해 flash 메시지가 연결됨.
	});
});


//---------------------------------------일반 페이징 -------------------------------------
router.get('/page/:cur', (req, res, next) => {   
	//-------------------------------//
	//페이지당 게시물 수 : 한 페이지 당 5개 게시물
	var page_size= 5;
	//페이지의 갯수 : 1 ~ 5개 페이지
	var page_list_size = 5;
	//limit 변수
	var no ='';
	//전체 게시물의 숫자
	var totalPageCount = 0;
	
	var pageNum = req.params.cur;
	var offset = 0;
	console.log("페이지"+ pageNum);
	if(pageNum > 1) {
		offset = 5 * (pageNum - 1);
	}
	console.log("오프셋" + offset);
	Post.findAndCount({
		distinct: true,
		include: [{
			model: User,    //찾을 때 좋아요를 누른 사람도 찾는다
			attributes: ['id', 'nick'],
			as: 'Liker',
		}, {
			model: User,
			attributes: ['id', 'nick'],
		}, {
			model: Comment,
			attributes: ['id','content', 'createdAt', 'userId', 'commenter'],
		}],
			offset: offset,
			limit: 5,
		order: [
			[  'createdAt', 'DESC'],
			[  Comment, 'createdAt', 'DESC']
			],      //게시글 순서는 최신순으로 정렬
	})
		.then((posts) => {
			var str = JSON.stringify(posts);
			console.log(str.comment);
			console.log('가능?'+str);
			totalPageCount = posts.count;
			var curPage = req.params.cur;
			console.log("현재 페이지 : " + curPage, "전체 카운트 : " + totalPageCount);
			if (totalPageCount < 0) {
				totalPageCount = 0;
				}

				var totalPage = Math.ceil(totalPageCount / page_size);// 전체 페이지수
				var totalSet = Math.ceil(totalPage / page_list_size); //전체 세트수
				var curSet = Math.ceil(curPage / page_list_size); // 현재 셋트 번호
				var startPage = ((curSet - 1) * 5) + 1; //현재 세트내 출력될 시작 페이지
				var endPage = (startPage + page_list_size) - 1; //현재 세트내 출력될 마지막 페이지
				
			//현재페이지가 0 보다 작으면
			if (endPage > totalPage) {
				endPage = totalPage;
			}
			var result2 = {
					"curPage": curPage,
					"page_list_size": page_list_size,
					"page_size": page_size,
					"totalPage": totalPage,
					"totalSet": totalSet,
					"curSet": curSet,
					"startPage": startPage,
					"endPage": endPage
					};
			var str2 = JSON.stringify(result2);
			console.log("최종" + str2);
			res.render('main', {
				title: 'NodeBird',
				twits: posts.rows,
				user: req.user,      //pug에서 user 객체를 통해 사용자 정보에 접근할 수 있게 되었다.
				paging: result2,
				loginError: req.flash('loginError'), //에러 메세지를 보여주기 위해 flash 메시지가 연결됨.
		});
	})
	.	catch((error) => {
		console.error(error);
		next(error);
	});
});





//---------------------------------------태그 검색 페이징 -------------------------------------
router.get('/page/:cur/hashtag', (req, res, next) => {   
	//-------------------------------//
	//페이지당 게시물 수 : 한 페이지 당 5개 게시물
	var page_size= 5;
	//페이지의 갯수 : 1 ~ 5개 페이지
	var page_list_size = 5;
	//limit 변수
	var no ='';
	//전체 게시물의 숫자
	var totalPageCount = 0;
	
	var pageNum = req.params.cur;
	var offset = 0;
	console.log("페이지"+ pageNum);
	if(pageNum > 1) {
		offset = 5 * (pageNum - 1);
	}
	
	const query = req.query.hashtag; 
	console.log("해쉬태그"+ query);
	if(!query) {            //해시태그가 빈 문자열인 경우 메인페이지로
		return res.redirect('/page/1');
	}
	Post.findAndCount({
		distinct: true,
		include: [{    // 조인할 대상을 include에 배열로 넘겨준다. 
			model: User,   //post 모델에 User을 조인함. 작성자를 가져옴
			attributes: ['id', 'nick'],      //JSON해서 제공
			as: 'Liker',
		}, {
			model: Hashtag,    //찾을 때 좋아요를 누른 사람도 찾는다
			where: { title: { [Op.like]: "%" +query + "%" }},
		},{
			model: User,
			attributes: ['id', 'nick'],
		}, {
			model: Comment,
			attributes: ['id','content', 'createdAt', 'userId', 'commenter'],
		}],
			offset: offset,
			limit: 5,
		order: [
			[  'createdAt', 'DESC'],
			[  Comment, 'createdAt', 'DESC']
		],      //게시글 순서는 최신순으로 정렬
	})
		.then((posts) => {
			var str = JSON.stringify(posts);
			console.log('가능?'+str);
			totalPageCount = posts.count;
			var curPage = req.params.cur;
			console.log("현재 페이지 : " + curPage, "전체 카운트 : " + totalPageCount);
			
			if (totalPageCount < 0) {
				totalPageCount = 0;
				}

				var totalPage = Math.ceil(totalPageCount / page_size);// 전체 페이지수
				var totalSet = Math.ceil(totalPage / page_list_size); //전체 세트수
				var curSet = Math.ceil(curPage / page_list_size); // 현재 셋트 번호
				var startPage = ((curSet - 1) * 5) + 1; //현재 세트내 출력될 시작 페이지
				var endPage = (startPage + page_list_size) - 1; //현재 세트내 출력될 마지막 페이지
				
			//현재페이지가 0 보다 작으면
			if (endPage > totalPage) {
				endPage = totalPage;
			}
			var result2 = {
					"curPage": curPage,
					"page_list_size": page_list_size,
					"page_size": page_size,
					"totalPage": totalPage,
					"totalSet": totalSet,
					"curSet": curSet,
					"startPage": startPage,
					"endPage": endPage
					};
			var str2 = JSON.stringify(result2);
			console.log("최종" + str2);
			res.render('main', {
				title: 'NodeBird',
				twits: posts.rows,
				user: req.user,      //pug에서 user 객체를 통해 사용자 정보에 접근할 수 있게 되었다.
				paging: result2,
				loginError: req.flash('loginError'), //에러 메세지를 보여주기 위해 flash 메시지가 연결됨.
				tag: req.query.hashtag,
		});
	})
	.	catch((error) => {
		console.error(error);
		next(error);
	});
});


//---------------------------------------추천 게시글 페이징 -------------------------------------
router.get('/page/:cur/recommend', (req, res, next) => {   
	//-------------------------------//
	//페이지당 게시물 수 : 한 페이지 당 5개 게시물
	var page_size= 5;
	//페이지의 갯수 : 1 ~ 5개 페이지
	var page_list_size = 5;
	//limit 변수
	var no ='';
	//전체 게시물의 숫자
	var totalPageCount = 0;
	
	var pageNum = req.params.cur;
	var offset = 0;
	console.log("페이지"+ pageNum);
	if(pageNum > 1) {
		offset = 5 * (pageNum - 1);
	}
	console.log("오프셋" + offset);
	Post.findAndCount({
		distinct: true,
		where: {recommend: { [Op.gte]: 5 }, },
		include: [
			{
			model: User,    //찾을 때 좋아요를 누른 사람도 찾는다
			attributes: ['id', 'nick'],
			as: 'Liker',
		}, {
			model: User,
			attributes: ['id', 'nick'],
		}, {
			model: Comment,
			attributes: ['id','content', 'createdAt', 'userId', 'commenter'],
		}],
			offset: offset,
			limit: 5,
		order: [
			[  'createdAt', 'DESC'],
			[  Comment, 'createdAt', 'DESC']
			],      //게시글 순서는 최신순으로 정렬
	})
		.then((posts) => {
			var str = JSON.stringify(posts);
			console.log(str.comment);
			console.log('가능?'+str);
			totalPageCount = posts.count;
			var curPage = req.params.cur;
			console.log("현재 페이지 : " + curPage, "전체 카운트 : " + totalPageCount);
			if (totalPageCount < 0) {
				totalPageCount = 0;
				}

				var totalPage = Math.ceil(totalPageCount / page_size);// 전체 페이지수
				var totalSet = Math.ceil(totalPage / page_list_size); //전체 세트수
				var curSet = Math.ceil(curPage / page_list_size); // 현재 셋트 번호
				var startPage = ((curSet - 1) * 5) + 1; //현재 세트내 출력될 시작 페이지
				var endPage = (startPage + page_list_size) - 1; //현재 세트내 출력될 마지막 페이지
				
			//현재페이지가 0 보다 작으면
			if (endPage > totalPage) {
				endPage = totalPage;
			}
			var result2 = {
					"curPage": curPage,
					"page_list_size": page_list_size,
					"page_size": page_size,
					"totalPage": totalPage,
					"totalSet": totalSet,
					"curSet": curSet,
					"startPage": startPage,
					"endPage": endPage
					};
			var str2 = JSON.stringify(result2);
			console.log("최종" + str2);
			res.render('recommend', {
				title: 'NodeBird',
				twits: posts.rows,
				user: req.user,      //pug에서 user 객체를 통해 사용자 정보에 접근할 수 있게 되었다.
				paging: result2,
				loginError: req.flash('loginError'), //에러 메세지를 보여주기 위해 flash 메시지가 연결됨.
		});
	})
	.	catch((error) => {
		console.error(error);
		next(error);
	});
});







	
	//-------------------------------//
/*	Post.findAll({              		//메인 페이지 로딩 시 메인 페이지와 게시글을 함께 로딩. 데이터베이스에서 게시글을 조회한 뒤 결과를 twits에 넣어 렌더링합니다.         
		include: {    // 조인할 대상을 include에 배열로 넘겨준다. 
			model: User,   //post 모델에 User을 조인함
			attributes: ['id', 'nick'],      //JSON해서 제공
		},
		order: [['createdAt', 'DESC']],      //게시글 순서는 최신순으로 정렬
	})
		.then((posts) => {
			res.render('main', {
				title: 'NodeBird',
				twits: posts,
				user: req.user,      //pug에서 user 객체를 통해 사용자 정보에 접근할 수 있게 되었다.
				loginError: req.flash('loginError'), //에러 메세지를 보여주기 위해 flash 메시지가 연결됨.
		});
	})
	.	catch((error) => {
		console.error(error);
		next(error);
	});
});*/

module.exports = router;