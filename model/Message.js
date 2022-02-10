export default class Message{
    constructor(sender, message) {
        this.sender = sender;
        this.message = message;
        this.time = new Date().toTimeString().slice(0, 8);
    }
}