export function sortMarkers(a, b) {
    const diff = b.laps.length - a.laps.length
    if (diff === 0) {
        return b.laps.at(-1) - a.laps.at(-1)
    }
    return diff
}

export function sortByTime(a, b) {
    const aTime = a.laps.at(-2) - a.laps.at(-1)
    const bTime = b.laps.at(-2) - b.laps.at(-1)
    return bTime - aTime
}

export function getBestTime(laps) {
    if(laps.length < 2) return -1
    const times = []
    for (let i = 0;i<laps.length-1;i++) {
        times.push(laps[i+1] - laps[i])
    }
    console.log(times)
    return times.sort((a,b)=>a-b)[0]
}