/*jshint esversion: 6 */

module.exports = (sequelize, DataTypes) => (
		sequelize.define('user', {
			email: {
				type: DataTypes.STRING(40),
				allowNull: false,
				unique: true,
			},
			nick: {
				type: DataTypes.STRING(15),
				allowNull: false,
			},
			password: {
				type: DataTypes.STRING(100),
				allowNull: true,
			},
			provider: {
				type: DataTypes.STRING(10),
				allowNull: false,
				defaultValue: 'local',    //local이면 로컬 로그인, kakao면 카카오 로그인. 기본은 로컬
			},
			snsId: {
				type: DataTypes.STRING(30),       //sns 로그인 시 id 저장
				allowNull: true,
			},
		}, {
			timestamps: true,     //createdAt, updatedAt 컬럼 추가
			paranoid: true,		  //deletedAt 컬럼 추가
			charset: 'utf8',
			collate: 'utf8_general_ci',
		})		
);

