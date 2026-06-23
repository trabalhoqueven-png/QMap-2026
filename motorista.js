import { auth, db } from "./firebase.js";

import {
collection,
onSnapshot,
query,
where,
doc,
updateDoc
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const map =
L.map("map")
.setView([-17.8,-50.9],13);

L.tileLayer(
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{
attribution:"© OpenStreetMap"
}
).addTo(map);

const listaCorridas =
document.getElementById(
"listaCorridas"
);

let motoristaUid = null;

let markers = [];

onAuthStateChanged(
auth,
(user)=>{

if(!user){

location.href =
"index.html";

return;

}

motoristaUid =
user.uid;

iniciarGPS();

carregarCorridas();

}
);

function iniciarGPS(){

navigator.geolocation.watchPosition(

async(pos)=>{

const lat =
pos.coords.latitude;

const lng =
pos.coords.longitude;

await updateDoc(

doc(
db,
"usuarios",
motoristaUid
),

{
lat,
lng,
online:true
}

);

},

(err)=>{
console.log(err);
},

{
enableHighAccuracy:true
}

);

}

function carregarCorridas(){

onSnapshot(

query(
collection(db,"corridas"),
where(
"status",
"==",
"aguardando"
)
),

(snapshot)=>{

listaCorridas.innerHTML="";

markers.forEach(m=>{
map.removeLayer(m);
});

markers=[];

snapshot.forEach((docSnap)=>{

const corrida = {

id:docSnap.id,

...docSnap.data()

};

const div =
document.createElement("div");

div.className =
"corrida";

div.innerHTML = `

<p>
Origem:
${corrida.origemLat}
,
${corrida.origemLng}
</p>

<p>
Destino:
${corrida.destinoLat}
,
${corrida.destinoLng}
</p>

<button
onclick="aceitarCorrida('${corrida.id}')">
Aceitar Corrida
</button>

`;

listaCorridas
.appendChild(div);

const markerOrigem =
L.marker([
corrida.origemLat,
corrida.origemLng
])
.addTo(map)
.bindPopup(
"Passageiro"
);

markers.push(
markerOrigem
);

});

}

);

}

window.aceitarCorrida =
async(id)=>{

await updateDoc(

doc(
db,
"corridas",
id
),

{
status:"aceita",
motoristaUid
}

);

alert(
"Corrida aceita!"
);

};