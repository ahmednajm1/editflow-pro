// dspTools.js — DSP Controller with adaptive parameters
class DSPTools {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.worker = new Worker('js/dspWorker.js');
        this.resolvers = {};
        this.worker.onmessage = (e) => {
            const { status, action, result, error, percent } = e.data;
            if (!this.resolvers[action]) return;
            if (status === 'done') { this.resolvers[action].resolve(result); delete this.resolvers[action]; }
            else if (status === 'progress' && this.resolvers[action].onProgress) { this.resolvers[action].onProgress(percent); }
            else if (status === 'error') { this.resolvers[action].reject(new Error(error)); delete this.resolvers[action]; }
        };
    }
    async decodeAudio(ab) { return await this.audioCtx.decodeAudioData(ab); }
    _send(action, buffer, config, onProgress) {
        return new Promise((resolve, reject) => {
            this.resolvers[action] = { resolve, reject, onProgress };
            const raw = buffer.getChannelData(0);
            const copy = new Float32Array(raw.length);
            copy.set(raw);
            this.worker.postMessage({ action, data: { channelData: copy, sampleRate: buffer.sampleRate }, config }, [copy.buffer]);
        });
    }
    async detectBeats(buffer, band, precision, onProgress) {
        return this._send("detectBeats", buffer, { band: band || "all", precision: precision || "normal" }, onProgress);
    }
    async detectSilenceAdaptive(buffer, minGap, onProgress) {
        return this._send("detectSilence", buffer, { minGap: minGap || 0.3, padding: 0.1 }, onProgress);
    }
}
window.DSPTools = DSPTools;
