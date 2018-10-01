/*jshint esversion: 6 */

//Multer는 미들웨어 역할을 합니다. 앱 전체에 붙는 게 아닌, multipart 데이터를 업로드 하는 라우터에 붙는 미들웨어입니다.
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sequelize = require("sequelize");
const Op = sequelize.Op;

const { Post, Hashtag, User } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();


fs.readdir('uploads', (error) => {
	if(error) {
		console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
		fs.mkdirSync('uploads');      //이미지를 업로드할 uploads 폴더가 없을 때 생성합니다.
	}
});


const upload = multer({                   //upload 변수는 미들웨어를 만드는 객체가 됩니다. 옵션으로 storage 속성과 limits 속성을 주었습니다.
	storage: multer.diskStorage({         //storage에는 파일 저장 방식과 경로, 파일명 등을 설정할 수 있습니다.  diskStorage를 사용해 이미지가 서버 디스크에 저장되도록 함.
		destination(req, file, cb) {      //diskStorage의 destination 메서드로 저장 경로를 nodebird 폴더 아래 uploads 폴더로 지정했습니다.
			cb(null, 'uploads/');
		},
		filename(req, file, cb) {        //파일명은 filename 메서드로 기존이름(file.originalname)에 업로드 날짜값(new Date().valueOf())과 기존 확장자(path.extname)을 붙이도록 설정.
			const ext = path.extname(file.originalname);
			console.log("ext입니다.: " + ext);
			cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);  //중복을 막기 위함이다.
			console.log("ext입니다.: " + ext);
			console.log("basename.: " + path.basename(file.originalname, ext) + new Date().valueOf() + ext);
			console.log("basename1: " + path.basename(file.originalname, ext));
			console.log("basename1: " + new Date().valueOf() + ext);
		},
	}),
	limits: { fileSize: 5 * 1024 * 1024 },   //최대 이미지 파일 용량 허용치. 10mb로 설정됨
});


//----------------------이미지 업로드 처리------------------
router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {     //이미지 업로드를 처리하는 라우터. single을 사용. 값으로는 req.body 속성의 이름을 적어줍니다.
	res.json({ url: `/img/${req.file.filename}`});   //클라이언트로 보내 나중에 게시글을 등록할 때 사용
});								//upload 변수는 미들웨어를 만드는 여러가지 메서드를 가지고 있습니다. single, array, fields, none이 자주 쓰임.
								//single은 하나의 이미지를 업로드할 때 사용하며, req.file 객체를 생성합니다.
                                //array와 fields는 여러 개의 이미지를 업로드할 때 사용. req.files객체를 생성. 차이점은 이미지를 업로드한 body 속성 개수입니다. 
								//속성 하나에 이미지 여러개는 array, 여러 개의 속성에 이미지 하나씩은 fields
								//none은 이미지를 올리지 않고 데이터만 multipart 형식으로 전송할 때 사용합니다.


const upload2 = multer();    
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {  //게시글 업로드를 처리. 이미지를 업로드 했다면 이미지 주소도 req.body.url로 보냄. 이미지 주소가 온 것이지 이미지 데이터가 온 게 아니라
	try {                                                                //none으로 처리 가능. 게시글을 데이터베이스 저장한 후 게시글 내용에서 해시태그를 정규표현식으로 추출.
		const post = await Post.create({
			content: req.body.content,
			img: req.body.url,
			userId: req.user.id,
		});
		const hashtags = req.body.content.match(/#[^\s]*/g); 
		if(hashtags) {
			const result = await Promise.all(hashtags.map(tag => Hashtag.findOrCreate({
				where: { title: tag.slice(1).toLowerCase() },   //앞에 # 같은거 자르고 찾거나 저장한다는 뜻
			})));
			await post.addHashtags(result.map(r => r[0]));   //추출한 해시태크들을 데이터베이스에 저장 후, post.addHashtags 메서드로 게시글과 해시태그의 관계를 PostHashtag 테이블에 넣습니다.
		}
		res.redirect('/page/1');
	} catch(error) {
		console.error(error);
		next(error);
	}
});
//---------------------게시글 삭제------------------
router.delete('/:id', async(req, res, next) => {
	try{
		await Post.destroy({ where: {id: req.params.id, userId: req.user.id}});  //게시글 번호와 그 게시글의 유저와 요청 유저가 일치하는지 확인
		res.send('OK');
	}catch(error) {
		console.error(error);
		next(error);
	}
});




//----------------------해시태그 조회 및 검색------------------
router.get('/hashtag', async (req, res, next) => {     //해시태그로 조회하는 /post/hashtag 라우터.
	const query = req.query.hashtag;      //쿼리스트링으로 해시태그 이름을 받고
	if(!query) {            //해시태그가 빈 문자열인 경우 메인페이지로
		return res.redirect('/');
	}
	try {
		console.log("해시:" + query);
		const hashtag = await Hashtag.find({ where: { title: { [Op.like]: "%" +query + "%" }}});   //데이터베이스에 해당 해시태그가 존재하는지 검색후
		console.log("find 해시:" + hashtag);
		let posts = [];
		if (hashtag) {          //있으면 시퀄라이즈에서 제공하는 getPosts 메서드로 모든 게시글을 가져옵니다.
			posts = await hashtag.getPosts({ include: [{ model: User}] });   //가져올 때는 작성자의 정보를 JOIN.
		}
		return res.render('main', {       //조회 후 메인 페이지를 렌더링하면서 전체 게시글 대신 조회된 게시글만 twits에 넣어 렌더링합니다.
			title: `${query} | NodeBird`,
			user: req.user,
			twits: posts,
		});
	} catch(error) {
		console.error(error);
		return next(error);
	}
});


//----------------------좋아요, 좋아요 취소------------------
router.post('/:id/like', async(req, res, next) => {
	try{
		const post = await Post.find({ where: { id: req.params.id}});  //좋아요가 눌린 게시글
		await post.addLiker(req.user.id); //req.user.id는 게시글에 좋아요를 누른 사람
		res.send('OK');
	} catch (error) {
		console.error(error);
		next(error);
	}
});

router.delete('/:id/unlike', async (req, res, next) => {
	try {
		const post = await Post.find({ where: { id: req.params.id}});
		await post.removeLiker(req.user.id);
		res.send('OK');
	} catch(error) {
		console.error(error);
		next(error);
	}
});


//----------------------게시글 수정------------------
router.get('/:id/update', async(req, res, next) => {
	try {
		const posts = await Post.find({ where: { id: req.params.id} });
	    var str = JSON.stringify(posts);
		return res.render('postUpdate', {
			posts: posts,
			user: req.user,
		});
	} catch(error){
		console.error(error);
		next(error);
	}
});


router.post('/:id/update', isLoggedIn, upload2.none(), async(req, res, next) => {
	try {
		const post = await Post.update({
			content: req.body.contents,
			img: req.body.url,
		}, {
			where: { id: req.params.id}
		});
		const hashtags = req.body.contents.match(/#[^\s]*/g); 
		if(hashtags) {
			const result = await Promise.all(hashtags.map(tag => Hashtag.findOrCreate({
				where: { title: tag.slice(1).toLowerCase() },   //앞에 # 같은거 자르고 찾거나 저장한다는 뜻
			})));
		}
		res.redirect('/page/1');
	} catch(error) {
		console.error(error);
		next(error);
	}
});



module.exports = router;