/*jshint esversion: 6 */
const mongoose = require('mongoose');

const { Schema } = mongoose;
const roomSchema = new Schema ({
	title: {
		type: String,
		required: true,
	},
	max: {
		type: Number,
		required: true,
		defaultValue: 10,   //수용인원 기본 10명, 최소 2명
		min: 2,
	},
	owner: {
		type: String,
		required: true,
	},
	password: String,   //비밀번호를 설정하면 비밀방
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model('Room', roomSchema);