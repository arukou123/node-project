/*jshint esversion: 6 */

exports.isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) {             //passport는 req 객체에 isAuthenticated 메서드를 추가합니다. 로그인 중이면 true, 아니면 false 입니다.
		next();								//이걸로 로그인 여부 판단.
	} else {
		res.status(403).send('로그인 필요');
	}
};

exports.isNotLoggedIn = (req, res, next) => {
	if (!req.isAuthenticated()) {
		next();
	} else {
		res.redirect('/page/1');
	}
};
