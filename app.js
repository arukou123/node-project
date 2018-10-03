/*jshint esversion: 6 */

const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const bodyParser = require('body-parser');   
//------채팅방-------
const ColorHash = require('color-hash');    //사용자에게 고유한 색상 부여
const helmet = require('helmet'); // 서버의 각종 취약점 보완
const hpp = require('hpp'); //서버의 각종 취약점 보완
//const RedisStore = require('connect-redis')(session);  //세션을 인자로 넣어야 한다.
require('dotenv').config();  //cookieParser와 session의 비밀키는 직접 하드코딩하지 않습니다. 소스 코드가 유출되면 키도 유출되니 별도로 관리해야 합니다.
                             //이를 위한 패키지가 dotenv입니다. 비밀키는 .env라는 파일에 모아두고 dotenv가 읽어 process.env 객체에 넣습니다.

const webSocket = require('./socket');    //웹소켓 추가
const connect = require('./schemas');  //몽고디비 연결 추가
//------채팅방-------
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const chatRouter = require('./routes/chat');
const commentRouter = require('./routes/comment');
const { sequelize } = require('./models');
const passportConfig = require('./passport');   //require('./passport/index.js)와 같다. 폴더 내의 index.js 파일은 require시 생략 가능
const logger = require('./logger'); //위험도 로그 사용

const app = express();
connect();
sequelize.sync();  //모델을 서버와 연결
passportConfig(passport);




app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('port', process.env.PORT || 8001);  //port 8001번 사용


//-----------개발환경인지 배포환경인지 정함.-------------------
if (process.env.NODE_ENV === 'production') {
	  app.use(morgan('combined'));    //combined가 로그 더 많이 남김
	  app.use(helmet());
	  app.use(hpp());
	} else {
	  app.use(morgan('dev'));
	}
//-----------개발환경인지 배포환경인지 정함.-------------------


app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use('/chat/gif', express.static(path.join(__dirname, 'chatUploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));


//-----------개발환경인지 배포환경인지 정함.-------------------
const sessionMiddleware = session({
	  resave: false,
	  saveUninitialized: false,
	  secret: process.env.COOKIE_SECRET,
	  cookie: {
	    httpOnly: true,
	    secure: false,
	  },
	 /* store: new RedisStore({  //이제 세션을 RedisStore에 저장한다. 
		 host: process.env.REDIS_HOST,
		 port: process.env.REDIS_PORT,
		 pass: process.env.REDIS_PASSWORD,
		 logErrors: true,  //에러가 났을 때 콘솔에 표시할지를 결정.
	  }),*/
	});
/*if (process.env.NODE_ENV === 'production') {
	sessionMiddleware.proxy = true;    //https를 적용할 때만 필요
}*/
app.use(sessionMiddleware);
//-----------개발환경인지 배포환경인지 정함.-------------------


app.use(flash());
//----------------------------------세션 별 색상 부여 -------------------------------
app.use((req, res, next) => {
	if (!req.session.color) {                 //규모가 크면 중복 색상이 나온다.
		const colorHash = new ColorHash();
		req.session.color = colorHash.hex(req.sessionID);
		console.log("세션컬러" + req.session.color);
	}
	next();
});
app.use(passport.initialize());  //initialize 미들웨어는 요청(req 객체)에 passport 설정을 심는다.
app.use(passport.session());	 //req.session 객체에 passport 정보를 저장합니다. express-session에서 req.session 객체를 생성하므로 	
								//passport 미들웨어는 exress-session 미들웨어보다 뒤에 있어야 합니다.


app.use('/chat', chatRouter);
app.use('/', pageRouter);
app.use('/auth', authRouter);
app.use('/post', postRouter);
app.use('/user', userRouter);
app.use('/comment', commentRouter);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  logger.info('hello');
  logger.error(err.message);
  next(err);
});

app.use((err, req, res) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});



const server = app.listen(app.get('port'), () => {
	  console.log(app.get('port'), '번 포트에서 대기중');
	});



webSocket(server, app, sessionMiddleware);   //채팅 소켓 서버 연결  . app을 추가해줘야 사용자 별 색상 사용 가능. Socket.IO가 세션에 접근하려면 sessionMiddleware 추가
