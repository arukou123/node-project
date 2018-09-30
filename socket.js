/*jshint esversion: 6 */

const SocketIO = require('socket.io');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cookie = require('cookie-signature');  //암호화 된 쿠키

module.exports = (server, app, sessionMiddleware) => {     //app.js 맨 마지막 부분에 session 추가해줘서 session 객체 사용 가능
	const io = new SocketIO(server, { path: '/socket.io'});
	
	app.set('io', io);    //라우터에서 io 객체를 쓸 수 있게 저장해둡니다. req.app.get('io')로 접근 가능합니다.
	const room = io.of('/room');   //Socket.IO에 네임스페이스를 부여하는 of 메서드이다. 기본적으로 '/'가 네임스페이스. 같은 네임스페이스 끼리만 데이터를 전달
	const chat = io.of('/chat');
	
	io.use((socket, next) => {    //이걸 정의해야 밑에 cookie.sign을 쓸 수 있다.
		cookieParser(process.env.COOKIE_SECRET)(socket.request, socket.request.res, next);
	});
	
	io.use((socket, next) => {      //io.use 메서드에 미들웨어 장착. 이 부분은 모든 웹 소켓 연결 시마다 실행됨. 세션 미들웨어에 요청 객체, 응답 객체, 함수를 인자로 넣어줌
		sessionMiddleware(socket.request, socket.request.res, next);
	});
	
	
	
//---------------------------------- /room 네임스페이스 이벤트 리스너 -------------------------------	
	room.on('connection', (socket) => {
		console.log('room 네임스페이스에 접속');
		socket.on('disconnect', () => {
			console.log('room 네임스페이 접속 해제');
		});
	});
	
	
//----------------------------------/chat 네임스페이스 이벤트 리스너 -------------------------------	
	chat.on('connection', (socket) => {
		console.log('chat 네임스페이스에 접속');
		const req = socket.request;
		const { headers: {referer} } = req;
		const roomId = referer    //socket.request.headers.referer을 통해 현재 웹페이지 URL을 가져올 수 있고, 그 부분에서 방 아이디 부분을 추출
			.split('/')[referer.split('/').length - 1]
			.replace(/\?.+/, '');                 
		socket.join(roomId);    //접속 시 사용할 join 메서드. room은 네임스페이스 안의 개념으로, 네임스페이스 중에서 같은 room의 소켓들만 데이터를 주고받을 수 있다. 
		//----------------------------------특정 방에 데이테 보냄 -------------------------------		
		/*socket.to(roomId).emit('join', {  //세션 미들웨어와 Socket.IO를 연결했으므로, 웹 소켓에서 세션을 사용 가능.
			user: 'system',
			chat: `${req.session.color}님이 입장하셨습니다.`,  //방에 참여할 때마다 누군가가 입장했다는 메세지를 보냄
			number: socket.adapter.rooms[roomId].length,  //사용자 수 실시간 전파
		});*/
		//----------------------------------특정 방에 데이테 보냄 -------------------------------	
		axios.post(`http://localhost:8001/chat/room/${roomId}/sys`, {
			number: socket.adapter.rooms[roomId].length,
			type: 'join',
		}, {
			headers: {     //connect.sid가 암호화 된 쿠키. express-session의 세션 쿠키. application의 세션에 저장됨.  s3%A로 시작하는 쿠키를 만들고 이걸로 같은 사람인지 판별
				Cookie: `connect.sid=${'s%3A' + cookie.sign(req.signedCookies['connect.sid'], process.env.COOKIE_SECRET)}`,  //익스프레스가 암호화를 알아서 풀고 다시 암호화 해서 보내야함.
			},
		});
		
		
		socket.on('disconnect', () => {    //join과 leave는 방의 아이디를 인자로 받아 room을 구성.
			console.log('chat 네임스페이스 접속 해제');
			socket.leave(roomId);     //연결 끊기면 방에서 나가는 메소드
			//----------------------------------퇴장 부분 -------------------------------
			const currentRoom = socket.adapter.rooms[roomId];
			const userCount = currentRoom ? currentRoom.length : 0;
			if (userCount === 0) {
				axios.delete(`http://localhost:8001/chat/room/${roomId}`)
					.then(() => {
						console.log('방 제거 요청 성공');
					})
					.catch((error) => {
						console.error(error);
					});
			} else {
				/*socket.to(roomId).emit('exit', {
					user: 'system',
					chat: `${req.session.color}님이 퇴장하셨습니다.`,
					number: socket.adapter.rooms[roomId].length,  //사용자 수 실시간 전파
				});*/
				axios.post(`http://localhost:8001/chat/room/${roomId}/sys`, {
					number: socket.adapter.rooms[roomId].length,   //socket.io 주석 처리하면서 못 넘기는거 이걸로 넘긴다
					type: 'exit',
				}, {
					headers: {
						Cookie: `connect.sid=${'s%3A' + cookie.sign(req.signedCookies['connect.sid'], process.env.COOKIE_SECRET)}`,
					},
				});
			}
		});
		//----------------------------------귓속말 부분. chat.pug에서 값 넘긴다. -------------------------------
		socket.on('dm', (data) => {
			socket.to(data.target).emit('dm', data);   //방 아이디 말고 개인의 socket.id를 알려줌.
		});
		//----------------------------------강 부분. chat.pug에서 값 넘긴다. -------------------------------
	});
};