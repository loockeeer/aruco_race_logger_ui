import {writable} from 'svelte/store'

export const state = writable({
    markers: {},
    unit: "",
    line: -1
});

class WSMessages {

    static ERROR = "e"
    static ACK = "a"

    static REQUEST = "rq"
    static REQUEST_CONFIG = "c"
    static REQUEST_HISTORY = "h"

    static RESPONSE = "rs"
    static RESPONSE_CONFIG = "c"
    static RESPONSE_HISTORY = "h"

    static MARKER_DATA = "m"
    static MARKER_DETECTED = "d"
    static MARKER_LAP = "l"

    static getRequest(type, kind, data) {
        return JSON.stringify({
            "t": type,
            "k": kind,
            "d": data
        })
    }

    static getConfigRequest() {
        return WSMessages.getRequest(WSMessages.REQUEST, WSMessages.REQUEST_CONFIG, {})
    }

    static getHistoryRequest() {
        return WSMessages.getRequest(WSMessages.REQUEST, WSMessages.REQUEST_HISTORY, {})
    }

}

class WSClient extends WebSocket {
    constructor(...args) {
        super(...args)
        this.addEventListener("open", this._open.bind(this))
        this.addEventListener("message", this._message.bind(this))
        this.callbacks = []
    }

    on(e, c) {
        this.callbacks.push([e, c])
    }

    emit(e, d) {
        this.callbacks.forEach(c=> {
            if(c[0] === e) {
                c[1](d)
            }
        })
    }

    _open() {
        this.send(WSMessages.getConfigRequest())
        this.send(WSMessages.getHistoryRequest())
    }

    _message(message) {
        let res;
        try {
            res = JSON.parse(message.data)
        } catch {
            console.error("Bad content received from WS")
        }

        if (!res.hasOwnProperty("t")) {
            return console.error("Missing type")
        }
        if(!res.hasOwnProperty("k")) {
            return console.error("Missing kind")
        }
        switch(res.t) {
            case WSMessages.RESPONSE:
                switch(res.k) {
                    case WSMessages.RESPONSE_CONFIG:
                        this.emit("config", {
                            unit: res.d.u,
                            line_distance: res.d.l,
                            //markers: res.d.m
                        })
                        break
                    case WSMessages.RESPONSE_HISTORY:
                        this.emit("history", Object.fromEntries(
                            Object.entries(res.d).map(entry => [entry[0], {name: entry[1].n, id: entry[1].i, laps: entry[1].l, speed: entry[1].s, position: entry[1].p, rotation: entry[1].r}])
                        ))
                        break
                }
                break

            case WSMessages.MARKER_DATA:
                switch(res.k) {
                    case WSMessages.MARKER_DETECTED:
                        this.emit("detected", {
                            time: res.d.t,
                            id: res.d.i,
                            position: res.d.p,
                            rotation: res.d.r,
                            speed: res.d.s
                        })
                        break
                    case WSMessages.MARKER_LAP:
                        this.emit("lap", {
                            time: res.d.t,
                            id: res.d.i,
                            lap_count: res.d.l
                        })
                        break
                }
                break

            case WSMessages.ERROR:
                this.emit("error", res.k)
                console.error("Got error from ws,", res.k)
                break

            case WSMessages.ACK:
                this.emit("ack")
                console.log("Got an ack from ws")
                break
        }
    }
}

export const connect = (tries = 5) => {
    const ws = new WSClient("ws://"+location.hostname+":8082")
    ws.addEventListener("close", () => {
        if(tries === 0) {
            return console.error("WebSocket reconnect failed. Please refresh later")
        }
        console.error("WebSocket closed... Trying to reconnect in 3 seconds")
        setTimeout(connect, 3000, tries - 1)
    })

    ws.on("config", config => {
        state.update(state => {
            return {
                ...state,
                ...config
            }
        })
    })

    ws.on("history", markers => {
        state.update(state => {
            return {
                ...state,
                markers
            }
        })
    })

    ws.on("detected", marker => {
        state.update(state => {
            delete marker.time
            return {
                ...state,
                markers: {...state.markers, [marker.id]: {...(state.markers[marker.id] || {laps: [], speed: 0.0}), ...marker}}
            }
        })
    })

    ws.on("lap", lap_data => {
        state.update(state => {
            const newLaps = state.markers[lap_data.id]?.laps || []
            newLaps.push(lap_data.time)
            const audio = new Audio('ding.mp3')
            audio.loop = false
            audio.play()
            return {
                ...state,
                markers: {...state.markers, [lap_data.id]: {...(state.markers[lap_data.id] || {laps: [], speed: 0.0}), laps: newLaps}}
            }
        })
    })
}
