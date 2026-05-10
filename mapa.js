
import { auth, db }
from "./firebase.js";

import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const map =
L.map("map")
.setView([-10.184,-48.333],13);

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
  attribution:'© OpenStreetMap'
}
).addTo(map);

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

const modal =
document.getElementById("modal");

const abrirModal =
document.getElementById("abrirModal");

const fechar =
document.getElementById("fechar");

const salvar =
document.getElementById("salvar");

const veiculos = [];

const markers = [];

if(btnAdmin){
  btnAdmin.style.display = "none";
}

abrirModal.onclick = ()=>{
  modal.style.display = "flex";
};

fechar.onclick = ()=>{
  modal.style.display = "none";
};

btnSair.onclick = async()=>{

  await signOut(auth);

  location.href =
  "index.html";

};

onAuthStateChanged(auth,
async(user)=>{

  if(!user){

    location.href =
    "index.html";

    return;
  }

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

});

if(btnAdmin){

  btnAdmin.onclick = ()=>{

    location.href =
    "admin.html";

  };

}

onSnapshot(

  collection(db,"veiculos"),

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

salvar.onclick = async()=>{

  const nome =
  document.getElementById("nome").value;

  const placa =
  document.getElementById("placa").value;

  const imei =
  document.getElementById("imei").value;

  const status =
  document.getElementById("status").value;

  if(!nome || !placa || !imei){

    alert("Preencha tudo");

    return;
  }

  await addDoc(

    collection(db,"veiculos"),

    {
      nome,
      placa,
      imei,
      status,
      velocidade:0,
      lat:-10.184 + (Math.random()/100),
      lng:-48.333 + (Math.random()/100)
    }

  );

  modal.style.display =
  "none";

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
