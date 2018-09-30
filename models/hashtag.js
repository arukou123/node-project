/*jshint esversion: 6 */

module.exports = (sequelize, DataTypes) => (       //나중에 검색하기 위해 해시태그 모델을 따로 뒀음
		sequelize.define('hashtag', {
			title: {
				type: DataTypes.STRING(15),
				allowNull: false,
				unique: true,
			},
		}, {
			timestamps: true,     //createdAt, updatedAt 컬럼 추가
			paranoid: true,		  //deletedAt 컬럼 추가
			charset: 'utf8',
			collate: 'utf8_general_ci',   //데이터베이스 한글이 저장되지 않는 문제 해결. 데이터베이스 문자열을 UTF로 설정하겠다
		})		
);

