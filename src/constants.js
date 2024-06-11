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
    JOIN_LIKE:'joinLike',
    JOIN_DISLIKE:'joinDislike',
    ADDED_LIKE:'addedLike',
    ADDED_DISLIKE:'addedDislike',
});

export {
    DB_NAME,
    DATA_LIMIT,
    SocketEventEnum
}