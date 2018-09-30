const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sequelize = require("sequelize");
const Op = sequelize.Op;

const Room = require('../schemas/room');
const Chat = require('../schemas/chat');

const router = express.Router();


//----------------------------------메인화면 생성 화면을 렌더링 -------------------------------
router.get('/', async (req, res, next) => {
  try {
    const rooms = await Room.find({});
    res.render('chat/main', { rooms, title: 'GIF 채팅방', error: req.flash('roomError') });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

//----------------------------------채팅방 생성 화면을 렌더링 -------------------------------
router.get('/room', (req, res) => {
  res.render('chat/room', { title: 'GIF 채팅방 생성' });
});


//----------------------------------채팅방을 만드는 라우터 -------------------------------
router.post('/room', async (req, res, next) => {
  try {
    const room = new Room({
      title: req.body.title,
      max: req.body.max,
      owner: req.session.color,
      password: req.body.password,
    });
    const newRoom = await room.save();
    const io = req.app.get('io');    //저장했던 op 객체를 가져온다.
    io.of('/chat/room').emit('newRoom', newRoom);    // /roo, 네임스페이스에 연결한 모든 클라이언트에게 데이터를 보내는 메서드. main.pug의 newRoom 이벤트 리스너한테 보냄
    res.redirect(`/chat/room/${newRoom._id}?password=${req.body.password}`);  //get / 라우터에 접속한 모든 클라이언트가 새로 생성된 채팅방에 대한 데이터를 받을 수 있다.
  } catch (error) {
    console.error(error);
    next(error);
  }
});


//----------------------------------채팅방을 렌더링 -------------------------------
router.get('/room/:id', async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id });
    const io = req.app.get('io');
    if (!room) {
      req.flash('roomError', '존재하지 않는 방입니다.');
      return res.redirect('/chat');
    }
    if (room.password && room.password !== req.query.password) {
      req.flash('roomError', '비밀번호가 틀렸습니다.');
      return res.redirect('/chat');
    }
    const { rooms } = io.of('/chat').adapter;        //방 목록이 들어있다.
    if (rooms && rooms[req.params.id] && room.max <= rooms[req.params.id].length) {   //해당 방의 소켓 목록이 나오면서 이걸 세가지고 인원 파악
      req.flash('roomError', '허용 인원이 초과하였습니다.');
      return res.redirect('/chat');
    }
    // ---------기존 채팅 내역을 불러오도록 수정 --------------
    const chats = await Chat.find({ room: room._id, where: {createdAt: { [Op.gt]: req.createdAt},}, }).sort('createdAt');   //접속한 시간부터의 채팅만 불러옴. op.gt 저거 없으면 전체 다 불러온다
    return res.render('chat/chat', {
    	room,
    	title: room.title,
    	chats,
    	number: (rooms && rooms[req.params.id] && rooms[req.params.id].length + 1) || 1,   //방정보와 방의 인원을 number에 담아 보냄
    	user: req.session.color,
    })
    console.log(number);
  } catch (error) {
    console.error(error);
    return next(error);
  }
});


//---------------------------------- 채팅방을 삭제하는 라우터 -------------------------------
router.delete('/room/:id', async (req, res, next) => {
	  try {
	    await Room.remove({ _id: req.params.id });
	    await Chat.remove({ room: req.params.id });
	    res.send('ok');
	    setTimeout(() => {
	      req.app.get('io').of('/room').emit('removeRoom', req.params.id);
	    }, 2000);
	  } catch (error) {
	    console.error(error);
	    next(error);
	  }
	});


//---------------------------------- 채팅을 데이터베이스에 저장 후 같은 방에 전송 -------------------------------
router.post('/room/:id/chat', async (req, res, next) => {
	try {
		const chat = new Chat({
			room: req.params.id,
			user: req.session.color,
			chat: req.body.chat,
		});
		await chat.save();   //채팅을 데이터베이스에 저장
		//req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);  //  to(방아이디).emit으로 같은 방에 들어 있는 소켓들에게 메시지 데이터를 전송
		req.app.get('io').of('/chat').to(req.params.id).emit('chat', {
			socket: req.body.sid,  //특정인에게 귓속말을 보낼 수 있음
			room: req.params.id,
			user: req.session.color,
			chat: req.body.chat,
		});
		res.send('ok');
	} catch (error) {
		console.error(error);
		next(error);
	}
});


//---------------------------------- 채팅에 시스템 메세지 저장 후 전파(퇴장,입장 등등) -socket.js의 connect.sid 참고 -------------------------------
router.post('/room/:id/sys', async (req, res, next) => {
	try {
		const chat = req.body.type === 'join'
			? `${req.session.color}님이 입장하셨습니다.`
			: `${req.session.color}님이 퇴장하셨습니다.`;
		const sys = new Chat({
			room: req.params.id,
			user: 'system',
			chat,
		});
		await sys.save();
		req.app.get('io').of('/chat').to(req.params.id).emit(req.body.type, {  //채팅방에 뿌려줌
			user: 'system',
			chat,
			number: req.body.number,   //socket에서 넘긴거 받음
		});
		res.send('ok');
	} catch (error) {
		console.error(error);
		next(error);
	}
});


fs.readdir('chatUploads', (error) => {
	if (error) {
		console.error('chatUploads 폴더가 없어 폴더를 생성합니다.');
		fs.mkdirSync('chatUploads');
	}
});
const upload = multer({
	storage: multer.diskStorage({
		destination(req, file, cb) {
			cb(null, 'chatUploads/');
		},
		filename(req, file, cb) {
			const ext = path.extname(file.originalname);
			cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
		},
	}),
	limits: { fileSize: 5 * 1024 * 1024},
});


router.post('/room/:id/gif', upload.single('gif'), async (req, res, next) => {
	try{
		const chat = new Chat({
			room: req.params.id,
			user: req.session.color,
			gif: req.file.filename,
		});
		await chat.save();
		//req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
		req.app.get('io').of('/chat').to(req.params.id).emit('chat', {
			socket: req.body.sid,
			room: req.params.id,
			user: req.session.color,
			gif: req.file.filename,
		});
		res.send('ok');
	} catch (error) {
		console.error(error);
		next(error);
	}
});

module.exports = router;
