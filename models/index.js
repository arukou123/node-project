/*jshint esversion: 6 */

const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';    //얘가 DB에 테이블을 생성하게 연결해줌
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(
	config.database, config.username, config.password, config,
);


db.sequelize = sequelize;
db.Sequelize = Sequelize;

//-----------------------------DB생성 해주는 핵심인 것 같다.------------------------------
db.User = require('./user')(sequelize, Sequelize);
db.Post = require('./post')(sequelize, Sequelize);
db.Comment = require('./comment')(sequelize, Sequelize);
db.Hashtag = require('./hashtag')(sequelize, Sequelize);


//-----------------------------User와 Post의 관계 생성. 1:N------------------------------
db.User.hasMany(db.Post);        //User 모델과 Post 모델은 1:N 관계이므로 hasMany와 belongsTo로 연결. 시퀄라이즈는 Post 모델에 userId 컬럼을 추가합니다.
db.Post.belongsTo(db.User);


//-----------------------------Post와 Hashtag 관계 생성. N:M------------------------------
db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag'}); //N:M 관계이므로 belongsToMany 메서드로 정의 . 관계를 분석하여 PostHashTag라는 테이블을 자도으로 생성.
db.Hashtag.belongsToMany(db.Post, { through: 'PostHashtag'}); //컬럼 이름은 postId와 hashTagId 입니다. 
									//시퀄라이즈는 post 데이터에는 getHastags, addHashtags 등의 메서드를 추가. hashtag는 post 메서드를 추가


//-----------------------------User 테이블 내부조인?------------------------------
db.User.belongsToMany(db.User, {      //같은 테이블끼리도 N:M 관계를 가질 수 있다. 팔로잉 기능이 N:M 관계이다. 한 사용자가 여러 명을 팔로잉 할 수도 있고, 팔로워를 가질 수도 잉ㅆ습니다.
	foreignKey: 'followingId',		//같은 테이블 N:M 관계에서는 모델 이름과 컬럼 이름을 따로 정해줘야 합니다. through 옵션을 통해 생성할 모델 이름을 Follow로 정했습니다.
	as: 'Followers',				// as 옵션은 시퀄라이즈가 JOIN 작업 시 사용합니다. as에 등록한 이름으로 getFollowings, addFollowings 등의 메서드를 자동 추가합니다.
	through: 'Follow',
});

db.User.belongsToMany(db.User, {		//이렇게 NodeBird의 모델은 직접 생성한 User, Hashtag, Post와 시퀄라이즈가 추가한 PostHashtag, Follow 5개 입니다.
	foreignKey: 'followerId',
	as: 'Followings',
	through: 'Follow',
});

//--------------------------User와 Post의 '게시글 추천' N:M 관계----------------
db.User.belongsToMany(db.Post, { through: 'Like'});    // Like 테이블에 userId와 PostId 값이 있다.
db.Post.belongsToMany(db.User, { through: 'Like', as: 'Liker'});

//-----------------------------Comment와 Post, User의 관계 생성. 1:N------------------------------
db.Post.hasMany(db.Comment);       
db.Comment.belongsTo(db.Post);

db.User.hasMany(db.Comment);        
db.Comment.belongsTo(db.User);




module.exports = db;