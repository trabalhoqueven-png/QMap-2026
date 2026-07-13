import { auth, db }
from "./firebase.js";

import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  query,
  where,
  deleteDoc,
  updateDoc,
  serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const map =
L.map("map")

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
  attribution:'© OpenStreetMap'
}
).addTo(map);

const btnCorrida =
document.getElementById("btnCorrida");

const painelCorrida =
document.getElementById("painelCorrida");

const btnChamarCorrida =
document.getElementById("btnChamarCorrida");

let destinoLat = null;
let destinoLng = null;

let minhaLat = null;
let minhaLng = null;

let marcadorDestino = null;

let meuMarker = null;

let motoristasMarkers = [];

const listaVeiculos =
document.getElementById("listaVeiculos");

const onlineCount =
document.getElementById("onlineCount");

const veiculosCount =
document.getElementById("veiculosCount");

const btnAdmin =
document.getElementById("btnAdmin");

const btnSair =
document.getElementById("btnSair");

const btnVeiculos =
document.getElementById("btnVeiculos");

const veiculos = [];

const markers = [];

let painelVeiculosAberto = false;

btnVeiculos.onclick = () => {

  painelVeiculosAberto = !painelVeiculosAberto;

  if(painelVeiculosAberto){
    listaVeiculos.classList.add("ativo");
  } else {
    listaVeiculos.classList.remove("ativo");
  }

};

map.on("click", () => {
  listaVeiculos.classList.remove("ativo");
  painelVeiculosAberto = false;
});

if(btnAdmin){
  btnAdmin.style.display = "none";
}


btnSair.onclick = async()=>{

  await signOut(auth);

  location.href =
  "index.html";

};


if(btnAdmin){

  btnAdmin.onclick = ()=>{

    location.href =
    "admin.html";

  };

}

onAuthStateChanged(auth, async(user)=>{

  if(!user){

    location.href="index.html";
    return;

}

carregarMotoristasOnline();

  const userRef =
  doc(db,"usuarios",user.uid);

  const userSnap =
  await getDoc(userRef);

  if(userSnap.exists()){

    const dados =
    userSnap.data();

    if(dados.admin){

      btnAdmin.style.display =
      "block";

    }

  }

  /* =========================
     LISTAR VEICULOS DO USUARIO
  ========================= */

  onSnapshot(

    query(
      collection(db,"veiculos"),
      where("uid","==",user.uid)
    ),

    (snapshot)=>{

      veiculos.length = 0;

      snapshot.forEach((docSnap)=>{

        veiculos.push({

          id:docSnap.id,
          ...docSnap.data()

        });

      });

      renderizar();

    }

  );

});

function renderizar(){

  listaVeiculos.innerHTML = "";

  markers.forEach(m=>{
    map.removeLayer(m);
  });

  markers.length = 0;

  let online = 0;

  veiculos.forEach((v,index)=>{

    if(v.status === "online"){
      online++;
    }

    const div =
    document.createElement("div");

    div.className =
    "veiculo";

    div.innerHTML = `

      <h3>${v.nome}</h3>

      <p>🚘 ${v.placa}</p>

      <p>📡 ${v.imei}</p>

      <p>⚡ ${v.velocidade || 0} km/h</p>

      <button
      onclick="excluirVeiculo('${v.id}')">
        Excluir
      </button>

    `;

    div.onclick = ()=>{

      map.setView(
      [v.lat,v.lng],16);

    };

    listaVeiculos.appendChild(div);

    const marker =
    L.marker([v.lat,v.lng])
    .addTo(map)
    .bindPopup(v.nome);

    markers.push(marker);

  });

  onlineCount.innerText =
  online;

  veiculosCount.innerText =
  veiculos.length;

}

navigator.geolocation.watchPosition(

(pos)=>{

  minhaLat =
  pos.coords.latitude;

  minhaLng =
  pos.coords.longitude;

  if(!meuMarker){

    meuMarker =
    L.marker([minhaLat,minhaLng])
    .addTo(map)
    .bindPopup("Você");

    map.setView(
      [minhaLat,minhaLng],
      16
    );

  }else{

    meuMarker.setLatLng(
      [minhaLat,minhaLng]
    );

  }

}

);

document
.getElementById(
"btnSelecionarDestino"
)
.onclick = ()=>{

  alert(
  "Clique no mapa para escolher o destino"
  );

};

map.on("click",(e)=>{

  destinoLat =
  e.latlng.lat;

  destinoLng =
  e.latlng.lng;

  if(marcadorDestino){

    map.removeLayer(
      marcadorDestino
    );

  }

  marcadorDestino =
  L.marker(
    [destinoLat,destinoLng]
  )
  .addTo(map)
  .bindPopup("Destino");

});

btnChamarCorrida.onclick =
async()=>{

  if(
    !destinoLat ||
    !destinoLng
  ){

    alert(
    "Selecione o destino"
    );

    return;

  }

  const user =
  auth.currentUser;

  await addDoc(

    collection(
      db,
      "corridas"
    ),

    {

      passageiroUid:
      user.uid,

      origemLat:
      minhaLat,

      origemLng:
      minhaLng,

      destinoLat,

      destinoLng,

      status:
      "aguardando",

      motoristaUid:
      null,

      criadoEm:
      serverTimestamp()

    }

  );

  alert(
  "Corrida solicitada!"
  );

};

btnCorrida.onclick = ()=>{

  painelCorrida.classList.toggle("ativo");

};

window.excluirVeiculo =
async(id)=>{

  const confirmar =
  confirm("Excluir?");

  if(!confirmar) return;

  await deleteDoc(

    doc(db,"veiculos",id)

  );

};
/*==========================
 MOTORISTAS ONLINE
==========================*/

function carregarMotoristasOnline(){

    const q = query(
        collection(db,"usuarios"),
        where("tipo","==","motorista"),
        where("online","==",true)
    );

    onSnapshot(q,(snapshot)=>{

        onlineCount.innerText = snapshot.size;

        motoristasMarkers.forEach(m=>map.removeLayer(m));
        motoristasMarkers=[];

        snapshot.forEach((docSnap)=>{

            const motorista=docSnap.data();

            if(motorista.lat && motorista.lng){

                const marker=L.marker([motorista.lat,motorista.lng])
                .addTo(map)
                .bindPopup("🚗 "+motorista.nome);

                motoristasMarkers.push(marker);

            }

        });

    });

}