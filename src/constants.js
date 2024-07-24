const DB_NAME = 'chaiaurcode';
const DATA_LIMIT = '50MB';


const SocketEventEnum = Object.freeze({
    SOCKET_CONNECTED:'connected',
    SOCKET_DISCONNECTED:'disconnect',
    ADD_VIDEO_COMMENT:'addVideoComment',
    UPDATE_VIDEO_COMMENT:'updateVideoComment',
    ADD_TWEET_COMMENT:'addTweetComment',
    UPDATE_TWEET_COMMENT:'updateTweetComment',
    PUBLISH_VIDEO:"publishVideo",
    JOIN_COMMENT:'joinComment',
    JOIN_NOTIFICATION:'joinNotification',
    SOCKET_ERROR:'socketError',
    JOIN_VIDEO:'joinVideo',
    COMMENT_LIKE:'commentLike',
    COMMENT_DISLIKE:'commentDislike',
    ADDED_LIKE:'addedLike',
    REMOVE_REACTION:'removeReaction',
    REMOVE_COMMENT_REACTION:'removeCommentReaction',
    ADDED_DISLIKE:'addedDislike',
    ADD_SUBSCRIBER:'addSubscriber',
    REMOVE_SUBSCRIBER:'removeSubscriber',
});

export {
    DB_NAME,
    DATA_LIMIT,
    SocketEventEnum
}