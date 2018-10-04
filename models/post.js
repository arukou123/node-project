/*jshint esversion: 6 */

module.exports = (sequelize, DataTypes) => (   //게시글 등록자의 아이디를 담은 컬럼은 나중에 관계 설정할 때 시퀄라이즈가 알아서 생성
		sequelize.define('post', {
			content: {
				type: DataTypes.STRING(140),
				allowNull: false,
			},
			img: {                            //이미지 경로 저장.
				type: DataTypes.STRING(200),
				allowNull: true,
			},
			recommend: {
				type: DataTypes.INTEGER,
				defaultValue: '0',
			},
		}, {
			timestamps: true,     //createdAt, updatedAt 컬럼 추가
			paranoid: true,		  //deletedAt 컬럼 추가
			charset: 'utf8',
			collate: 'utf8_general_ci',
		})		
);

