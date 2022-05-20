<script>
  import {state, connect} from "./ws";
  import {getBestTime, sortByTime, sortMarkers} from "./utils";

  connect()

  export let data = {}
  window.data = data
  state.subscribe(d=> {
    data = d
  })

  export let formatter = new Intl.DateTimeFormat("fr-FR", {timeStyle: "medium"})

</script>
<main>
  <table class="min-w-full text-center">
    <thead class="bg-white border-b">
      <tr>
        <th scope="col">ID</th>
        <th scope="col">Nom</th>
        <th scope="col">Tours</th>
        <th scope="col">Heure Arrivée</th>
        <th scope="col">Temps au Tour</th>
        <th scope="col">Meilleur Temps</th>
        <th scope="col">Vitesse d'Arrivée ({data.unit}/s)</th>
      </tr>
    </thead>
    <tbody>
      <tr></tr>
      {#each Object.values(data.markers).filter(marker=>!!marker.name).sort(sortMarkers) as marker, i}
        <tr class={"h-8 " + (i%2 === 0 ? "bg-gray-100 border-b " : "bg-white border-b ") + (Object.values(data.markers).filter(m=>m.laps.length>1).sort(sortByTime)[0]?.id === marker.id ? "bg-yellow-300" : "")}>
          <td>{marker.id}</td>
          <td>{marker.name || "n/a"}</td>
          <td>{marker.laps.length}</td>
          <td>{marker.laps.length !== 0 ? formatter.format(new Date(marker.laps.at(-1) * 1000)) : "n/a"}</td>
          <td>{marker.laps.length > 1 ? new Date(1000* (marker.laps.at(-1) - marker.laps.at(-2))).toISOString().substr(11, 12) || "n/a" : "n/a"}</td>
          <td>{marker.laps.length > 1 ? new Date(1000* getBestTime(marker.laps)).toISOString().substr(11, 12) || "n/a" : "n/a"}</td>
          <td>{marker.speed.toFixed(2)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</main>

<style global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  td {
    @apply text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap border-r;
  }
  th {
    @apply text-sm font-medium text-gray-900 px-6 py-4;
  }
</style>


<!--
<style>
  * {
    margin: 0;
  }

  main {
    margin: 0;
    height: 100vh;
  }
  table {
    width: 100%
  }
table {
  font-family: Arial, Helvetica, sans-serif;
  border-collapse: collapse;
  width: 100%;
}

td, th {
  border: 1px solid #ddd;
  padding: 8px;
}

tr:nth-child(even){background-color: #f2f2f2;}
  tr:hover {background-color: #ddd;}
tr[data-highlight = true] {
  background-color: yellow;
}
  tr:hover[data-highlight = true] {background-color: orange;}

th {
  padding-top: 12px;
  padding-bottom: 12px;
  text-align: left;
  background-color: #04AA6D;
  color: white;
}
</style>
-->
