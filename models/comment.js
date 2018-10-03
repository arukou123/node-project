/*jshint esversion: 6 */

module.exports = (sequelize, DataTypes) => (
		sequelize.define('comment', {
			content: {
				type: DataTypes.STRING(140),
				allowNull: false,
			},
			commenter: {
				type: DataTypes.STRING(15),
				allowNull: false,
			},
		}, {
			timestamps: true,     //createdAt, updatedAt 컬럼 추가
			paranoid: true,		  //deletedAt 컬럼 추가
			charset: 'utf8',
			collate: 'utf8_general_ci',
		})		
);

