import { Clock } from "three";

export default class Ticker {
    clock = new Clock();
    subs = new Set();
    _raf = null;
    running = false;
    maxDelta = 1 / 15;

    constructor({ autoStart = false }) {
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) this.pause();
            else this.resume();
        });

        if (autoStart) {
            this.start();
        }
    }

    start() {
        if (this.running) return;

        this.running = true;
        this.clock.start();

        const loop = () => {
            if (!this.running) return;

            const raw = this.clock.getDelta();
            const dt = Math.min(this.maxDelta, raw);
            for (const fn of this.subs) fn(dt, this.clock.elapsedTime);
            this._raf = requestAnimationFrame(loop);
        };
        this._raf = requestAnimationFrame(loop);
    }

    pause() {
        if (!this.running) return;
        this.running = false;
        cancelAnimationFrame(this._raf);
        this.clock.stop();
    }

    resume() {
        if (this.running) return;

        this.start();
    }

    add(fn) {
        this.subs.add(fn);
        return () => this.subs.delete(fn);
    }

    clear() {
        this.subs = [];
    }
}
