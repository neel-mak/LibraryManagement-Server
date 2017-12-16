


const express = require('express');

const router = express.Router();
const winston = require('winston');
const moment = require('moment-timezone');
const _ = require('underscore');
const crypto = require('crypto');
const config = require('../config/config');
const utils = require('../utils/util');



router.post('/', (req, res) => {
    global.timeOffset = req.body.minutes;
    winston.info("Set global timeoffset to ",global.timeOffset,"minutes");
    res.json({
        success:true,
        message:"success"
    })
});

router.get('/', (req, res) => {
    winston.info("Global..",global.timeOffset);
    res.json({
        "currentTime":moment().tz('America/Los_Angeles').add('minutes',global.timeOffset).format("MMMM Do YYYY, h:mm a")
    })
});


module.exports = router;