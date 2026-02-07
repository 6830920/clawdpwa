/**
 * PWA 通道类型定义
 */
// 消息类型
export var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["AUDIO"] = "audio";
    MessageType["VIDEO"] = "video";
    MessageType["FILE"] = "file";
    MessageType["SYSTEM"] = "system";
})(MessageType || (MessageType = {}));
// 消息方向
export var MessageDirection;
(function (MessageDirection) {
    MessageDirection["INCOMING"] = "incoming";
    MessageDirection["OUTGOING"] = "outgoing"; // 从 Gateway 到客户端
})(MessageDirection || (MessageDirection = {}));
//# sourceMappingURL=types.js.map