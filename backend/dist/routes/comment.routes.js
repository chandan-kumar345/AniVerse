"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comment_controller_1 = require("../controllers/comment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Publicly viewable comments
router.get('/:animeId/:epNum', comment_controller_1.getEpisodeComments);
// Authenticated comment actions
router.post('/', auth_middleware_1.authMiddleware, comment_controller_1.createComment);
router.post('/:id/like', comment_controller_1.likeComment); // Can be public or authenticated. Let's allow public to keep it simple
router.delete('/:id', auth_middleware_1.authMiddleware, comment_controller_1.deleteComment);
exports.default = router;
