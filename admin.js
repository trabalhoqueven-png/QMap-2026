import { auth, db }
from "./firebase.js";

import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const lista =
document.getElementById("lista");

const btnSair =
document.getElementById("btnSair");

const salvar =
document.getElementById("salvar");

/* =========================
   LOGIN ADMIN
========================= */

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

  if(!userSnap.exists()){

    location.href =
    "mapa.html";

    return;
  }

  const dados =
  userSnap.data();

  if(!dados.admin){

    location.href =
    "mapa.html";

    return;
  }

});

/* =========================
   VOLTAR
========================= */

btnSair.onclick = ()=>{

  location.href =
  "mapa.html";

};

/* =========================
   SALVAR
========================= */

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
      uid: document.getElementById("uid").value,
      nome,
      placa,
      imei,
      status,
      velocidade:0,
      lat:-10.184 + (Math.random()/100),
      lng:-48.333 + (Math.random()/100)
    }

  );

  alert("Veículo salvo");

};

/* =========================
   LISTA
========================= */

onSnapshot(

  collection(db,"veiculos"),

  (snapshot)=>{

    lista.innerHTML = "";

    snapshot.forEach((docSnap)=>{

      const v =
      docSnap.data();

      const div =
      document.createElement("div");

      div.innerHTML = `

        <h3>${v.nome}</h3>

        <p>${v.placa}</p>

        <button
        onclick="excluir('${docSnap.id}')">

          Excluir

        </button>

      `;

      lista.appendChild(div);

    });

  }

);

window.excluir =
async(id)=>{

  await deleteDoc(

    doc(db,"veiculos",id)

  );

};