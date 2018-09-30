const { createLogger, format, transports } = require('winston');

const logger = createLogger({  //createLogger 메서드로 logger 객체 만듦. 인자로 설정을 넣을 수 있다. level, format, transports 등등이 설정임
  level: 'info',   //로그의 심각도. error, warn, verbose, silly, debug 등등.. error가 가장 심각. info를 고른 경우, info보다 더 심각한 단계의 로그도 함께 기록됩니다.
  format: format.json(),   //format은 로그인 형식. json, label, timestamp, printf, simple, combine 등의 다양한 형식. 보통은 JSON 형식이고 로그 기록 시간을 표시하려면 timestamp. combine은 여러 형식을 혼합할 때 사용
  transports: [   //로그 저장 방식. new transports.File은 파일로 저장한다는 뜻, transports.Console은 콘솔에 출력한다는 뜻.
    new transports.File({ filename: 'combined.log' }),
    new transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {   //배포 환경이 아닌 경우 파일뿐만 아니라 콘솔에도 출력
  logger.add(new transports.Console({ format: format.simple() }));
}

module.exports = logger;
