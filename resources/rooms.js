
const debug = require("debug")("emulator:rooms");
const express = require("express");

// default routing properties to mimic Cisco Spark
const router = express.Router({ "caseSensitive": true, "strict": false });

// for parsing application/json
const bodyParser = require("body-parser");
router.use(bodyParser.json());

// Extra imports 
const sendError = require('../utils').sendError;
const sendSuccess = require('../utils').sendSuccess;


// Create a room
router.post("/", function (req, res) {
    const db = req.app.locals.datastore;
    const actor = res.locals.person;

    // Check Media type
    const media = req.get("Content-Type");
    if (!media) {
        debug("no Content-Type specified");
        return sendError(res, 415, "Content type 'text/plain' not supported");
    }
    if (media !== "application/json") {
        debug(`bad 'Content-Type' specified: '${media}'`);
        return sendError(res, 415, `Content type '${media}' not supported`);
    }

    // Check incoming payload
    const incoming = req.body;
    if (!incoming) {
        return sendError(res, 400);
    }
    const title = incoming.title;
    if (!title || (typeof title != "string")) {
        debug("missing title property in incoming payload");
        return sendError(res, 400);
    }

    // Default values
    const type = incoming.type ? incoming.type : "group";
    if ((type !== "direct") && (type !== "group")) {
        debug(`not supported room type: ${type}`);
        return sendError(res, 400);
    }

    // Create room
    db.rooms.create(actor, title, type, function (err, room) {
        if (err) {
            debug("unexpected error: " + err.message);
            sendError(res, 500, "[EMULATOR] cannot create room, unexpected error");
            return;
        }

        // Return payload
        // Note that Cisco Spark returns 200 OK and not a 201 CREATED here
        return sendSuccess(res, 200, room);
    });
});


// List rooms
router.get("/", function (req, res) {
    const db = req.app.locals.datastore;
    const actor = res.locals.person;

    // Fetch list of rooms for current user
    db.rooms.list(actor, function (err, rooms) {
        if (err) {
            debug("unexpected error: " + err.message);
            sendError(res, 500, "[EMULATOR] cannot list rooms, unexpected error");
            return;
        }

        sendSuccess(res, 200, { "items": rooms });
    });
});


module.exports = router;