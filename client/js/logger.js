// logger.js
// Handles error mapping and offline system logs for the panel

class Logger {
    constructor() {
        this.history = [];
        // In a true Node.js environment via CEP:
        // this.fs = require('fs');
        // this.os = require('os');
        // this.logPath = this.os.homedir() + '/Desktop/EditFlowPro_Debug.log';
    }

    log(message) {
        const entry = `[INFO] ${new Date().toISOString()} : ${message}`;
        this.history.push(entry);
        console.log(entry);
        // this.fs.appendFileSync(this.logPath, entry + '\n');
    }

    error(message, errorObj) {
        const entry = `[ERROR] ${new Date().toISOString()} : ${message} | ${errorObj ? errorObj.stack : ''}`;
        this.history.push(entry);
        console.error(entry);
        // this.fs.appendFileSync(this.logPath, entry + '\n');
    }

    exportLog() {
        const blob = new Blob([this.history.join('\n')], {type: "text/plain;charset=utf-8"});
        const tempLink = document.createElement("a");
        tempLink.href = URL.createObjectURL(blob);
        tempLink.setAttribute("download", "EditFlowPro_Session.log");
        tempLink.click();
    }
}

window.appLogger = new Logger();
