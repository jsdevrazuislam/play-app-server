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
    SOCKET_ERROR:'socketError'
});

export {
    DB_NAME,
    DATA_LIMIT,
    SocketEventEnum
}