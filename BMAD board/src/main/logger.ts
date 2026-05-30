import log from 'electron-log/main';
import { app } from 'electron';

log.transports.file.maxSize = 5 * 1024 * 1024; // 5 MB

if (app.isPackaged) {
    log.transports.file.level = 'info';
    log.transports.console.level = false;
} else {
    log.transports.file.level = 'debug';
    log.transports.console.level = 'debug';
}

export default log;
