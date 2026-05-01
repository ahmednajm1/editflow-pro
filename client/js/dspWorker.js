// dspWorker.js
// EditFlow Pro v7 — Adaptive Silence Detection + Precision Beat Detection

var MAX_PROCESS_MS = 4000;
var TARGET_SR = 22050;

self.onmessage = function(e) {
    var action = e.data.action;
    var data = e.data.data;
    var config = e.data.config || {};

    try {
        var downsampled = downsample(data.channelData, data.sampleRate, TARGET_SR);

        if (action === "detectBeats") {
            var band = config.band || "all";
            var precision = config.precision || "normal"; // "normal" or "precision"
            var peaks;
            if (band === "all") {
                peaks = detectAllBands(downsampled, TARGET_SR, precision);
            } else {
                var b = BANDS[band];
                peaks = detectTransients(bandPass(downsampled, b.low, b.high, TARGET_SR), TARGET_SR, band, precision);
            }
            self.postMessage({ status: 'done', action: action, result: peaks });
        }

        if (action === "detectSilence") {
            var minGapSecs = config.minGap || 0.3;
            var padding = config.padding || 0.08;
            var speechSegments = detectSpeechAdaptive(downsampled, TARGET_SR, minGapSecs, padding);
            self.postMessage({ status: 'done', action: action, result: speechSegments });
        }
    } catch (err) {
        self.postMessage({ status: 'error', action: action, error: err.message });
    }
};

var BANDS = {
    all:    { low: 30,   high: 16000 },
    kicks:  { low: 40,   high: 200 },
    snares: { low: 200,  high: 2000 },
    hihats: { low: 5000, high: 16000 }
};

// ============================================================
// ADAPTIVE SILENCE / SPEECH DETECTION
// Instead of fixed threshold, we:
// 1. Measure the overall RMS of the audio
// 2. Set threshold relative to the content's own noise floor
// 3. Return SPEECH segments (non-silent regions) for the cutter
// ============================================================
function detectSpeechAdaptive(samples, sr, minGapSecs, padding) {
    var chunkSize = Math.floor(sr * 0.015); // 15ms analysis chunks
    var totalChunks = Math.ceil(samples.length / chunkSize);

    // Phase 1: Calculate RMS energy for every chunk
    progress("detectSilence", 5);
    var energies = new Float32Array(totalChunks);
    var energySum = 0;
    var peakEnergy = 0;

    for (var i = 0; i < totalChunks; i++) {
        var sum = 0;
        var off = i * chunkSize;
        var lim = Math.min(chunkSize, samples.length - off);
        for (var j = 0; j < lim; j++) {
            var s = samples[off + j];
            sum += s * s;
        }
        var rms = Math.sqrt(sum / lim);
        energies[i] = rms;
        energySum += rms;
        if (rms > peakEnergy) peakEnergy = rms;
    }

    var avgEnergy = energySum / totalChunks;

    // Phase 2: Determine adaptive threshold
    // The threshold is set between the noise floor and the average
    // A good heuristic: threshold = average * 0.15
    // This catches pauses between words where level drops significantly
    var threshold = avgEnergy * 0.15;

    // Safety: don't go below absolute minimum (for near-silent recordings)
    var absMinThreshold = peakEnergy * 0.02;
    if (threshold < absMinThreshold) threshold = absMinThreshold;

    progress("detectSilence", 20);

    // Phase 3: Classify each chunk as speech or silence
    var isSpeech = new Uint8Array(totalChunks);
    for (var i = 0; i < totalChunks; i++) {
        isSpeech[i] = energies[i] > threshold ? 1 : 0;
    }

    // Phase 4: Smooth the classification (fill small gaps)
    // Any silence gap shorter than ~100ms is probably just a consonant gap
    var smoothWindow = Math.ceil(0.1 * sr / chunkSize); // ~100ms in chunks
    for (var i = 0; i < totalChunks; i++) {
        if (isSpeech[i] === 0) {
            // Check if this is a tiny gap (speech on both sides within smoothWindow)
            var hasSpeechBefore = false;
            var hasSpeechAfter = false;
            for (var w = 1; w <= smoothWindow && i - w >= 0; w++) {
                if (isSpeech[i - w] === 1) { hasSpeechBefore = true; break; }
            }
            for (var w = 1; w <= smoothWindow && i + w < totalChunks; w++) {
                if (isSpeech[i + w] === 1) { hasSpeechAfter = true; break; }
            }
            if (hasSpeechBefore && hasSpeechAfter) {
                // Check if this gap is shorter than smoothWindow
                var gapLen = 0;
                for (var g = i; g < totalChunks && isSpeech[g] === 0; g++) gapLen++;
                if (gapLen <= smoothWindow) {
                    for (var g = i; g < i + gapLen && g < totalChunks; g++) isSpeech[g] = 1;
                }
            }
        }
    }

    progress("detectSilence", 50);

    // Phase 5: Extract speech segments
    var speechSegments = [];
    var segStart = null;

    for (var i = 0; i < totalChunks; i++) {
        if (isSpeech[i] === 1 && segStart === null) {
            segStart = i;
        } else if (isSpeech[i] === 0 && segStart !== null) {
            var gapLength = 0;
            for (var g = i; g < totalChunks && isSpeech[g] === 0; g++) gapLength++;

            var gapDurationSecs = (gapLength * chunkSize) / sr;

            if (gapDurationSecs >= minGapSecs) {
                // This is a real silence gap — close current speech segment
                var startSec = Math.max(0, (segStart * chunkSize / sr) - padding);
                var endSec = (i * chunkSize / sr) + padding;
                speechSegments.push({
                    start: Math.round(startSec * 1000) / 1000,
                    end: Math.round(endSec * 1000) / 1000
                });
                segStart = null;
            }
            // else: gap too short, keep as part of speech
        }
    }

    // Close final segment
    if (segStart !== null) {
        var startSec = Math.max(0, (segStart * chunkSize / sr) - padding);
        var endSec = (samples.length / sr);
        speechSegments.push({
            start: Math.round(startSec * 1000) / 1000,
            end: Math.round(endSec * 1000) / 1000
        });
    }

    progress("detectSilence", 100);
    return speechSegments;
}

// ============================================================
// BEAT DETECTION (Multi-Band + Precision Mode)
// ============================================================
function detectAllBands(samples, sr, precision) {
    progress("detectBeats", 5);
    var kicks = detectTransients(bandPass(samples, 40, 200, sr), sr, "kicks", precision);
    progress("detectBeats", 35);
    var snares = detectTransients(bandPass(samples, 200, 2000, sr), sr, "snares", precision);
    progress("detectBeats", 65);
    var hihats = detectTransients(bandPass(samples, 5000, 16000, sr), sr, "hihats", precision);
    progress("detectBeats", 90);

    var all = kicks.concat(snares).concat(hihats);
    all.sort(function(a, b) { return a - b; });

    // Merge nearby peaks
    var minSep = precision === "precision" ? 0.15 : 0.06;
    var merged = [];
    for (var i = 0; i < all.length; i++) {
        if (merged.length === 0 || all[i] - merged[merged.length - 1] >= minSep) {
            merged.push(all[i]);
        }
    }
    progress("detectBeats", 100);
    return merged;
}

function detectTransients(samples, sr, bandName, precision) {
    var blockSize = Math.floor(sr * 0.02);
    var totalBlocks = Math.ceil(samples.length / blockSize);
    var energies = new Float32Array(totalBlocks);

    for (var i = 0; i < totalBlocks; i++) {
        var e = 0, off = i * blockSize;
        var lim = Math.min(blockSize, samples.length - off);
        for (var j = 0; j < lim; j++) { var s = samples[off + j]; e += s * s; }
        energies[i] = Math.sqrt(e / lim);
    }

    var windowSize = 20;

    // Sensitivity based on band AND precision mode
    var baseSensitivity;
    switch (bandName) {
        case "kicks":  baseSensitivity = 1.4; break;
        case "hihats": baseSensitivity = 1.15; break;
        default:       baseSensitivity = 1.2; break;
    }

    // In precision mode, raise threshold significantly (fewer, stronger hits only)
    var sensitivity = precision === "precision" ? baseSensitivity * 1.5 : baseSensitivity;

    // Minimum separation
    var minSep;
    switch (bandName) {
        case "kicks":  minSep = precision === "precision" ? 0.25 : 0.15; break;
        case "hihats": minSep = precision === "precision" ? 0.12 : 0.05; break;
        default:       minSep = precision === "precision" ? 0.15 : 0.08; break;
    }

    // Onset rise requirement: in precision mode, require a STRONGER onset
    var onsetRatio = precision === "precision" ? 1.3 : 1.1;

    var peaks = [];
    for (var i = 1; i < totalBlocks; i++) {
        var ws = Math.max(0, i - windowSize), we = Math.min(totalBlocks - 1, i + windowSize);
        var sum = 0;
        for (var w = ws; w <= we; w++) sum += energies[w];
        var avg = sum / (we - ws + 1);

        if (energies[i] > avg * sensitivity && energies[i] > 0.008 && energies[i] > energies[i - 1] * onsetRatio) {
            var t = Math.round((i * blockSize / sr) * 1000) / 1000;
            if (peaks.length === 0 || t - peaks[peaks.length - 1] >= minSep) peaks.push(t);
        }
        if (peaks.length >= 2000) break;
    }
    return peaks;
}

// ============================================================
// AUDIO FILTERS
// ============================================================
function downsample(data, from, to) {
    if (from <= to) return data;
    var r = from / to, len = Math.floor(data.length / r), out = new Float32Array(len);
    for (var i = 0; i < len; i++) out[i] = data[Math.floor(i * r)];
    return out;
}
function lowPass(s, hz, sr) {
    var a = (1.0 / sr) / (1.0 / (2 * Math.PI * hz) + 1.0 / sr);
    var o = new Float32Array(s.length); o[0] = a * s[0];
    for (var i = 1; i < s.length; i++) o[i] = o[i-1] + a * (s[i] - o[i-1]);
    return o;
}
function highPass(s, hz, sr) {
    var a = (1.0 / (2 * Math.PI * hz)) / (1.0 / (2 * Math.PI * hz) + 1.0 / sr);
    var o = new Float32Array(s.length); o[0] = s[0];
    for (var i = 1; i < s.length; i++) o[i] = a * (o[i-1] + s[i] - s[i-1]);
    return o;
}
function bandPass(s, lo, hi, sr) { return lowPass(highPass(s, lo, sr), hi, sr); }
function progress(action, pct) { self.postMessage({ status: 'progress', action: action, percent: Math.round(pct) }); }
