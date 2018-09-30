/*jshint esversion: 6 */

const mongoose = require('mongoose');

const { MONGO_ID, MONGO_PASSWORD, NODE_ENV } = process.env;
const MONGO_URL = `mongodb://${MONGO_ID}:${MONGO_PASSWORD}@localhost:27017/admin`;

module.exports = () => {
	const connect = () => {
		if (NODE_ENV !== 'production') {    // 개발 환경이 아닐 때 몽구스가 생성하는 쿼리 내용을 콘솔로 확인할 수 있게 함.
			mongoose.set('debug', true);
		}
		mongoose.connect(MONGO_URL, {   //몽구스와 몽고디비를 연결하는 부분. 콜백 함수로 연결 여부 확인
			dbName: 'gifchat',
			useNewUrlParser: true,
		}, (error) => {
			if (error) {
				console.log('몽고디비 연결 에러', error);
			} else {
				console.log('몽고디비 연결 성공');
			}
		});
	};
	connect();
	
	mongoose.connection.on('error', (error) => {  //몽구스 커넥션이 리스너를 달았습니다. 에러 발생 시 기록하고, 연결 종료 시 재연결을 시도합니다.
		console.error('몽고디비 연결 에러', error);
	});
	
	mongoose.connection.on('disconnected', () => {
		console.error('몽고디비 연결이 끊겼습니다. 연결을 재시도합니다.');
		connect();
	});
	
	require('./chat');
	require('./room');
};