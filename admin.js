import { auth, db } from "./firebase.js";

import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const totalVeiculos =
document.getElementById("totalVeiculos");

const online =
document.getElementById("online");

const usuarios =
document.getElementById("usuarios");

const lista =
document.getElementById("lista");

const btnSair =
document.getElementById("btnSair");

let usuarioAtual = null;

onAuthStateChanged(auth, async(user)=>{

  if(!user){

    location.href = "index.html";

    return;
  }

  usuarioAtual = user;

  const userRef =
  doc(db,"usuarios",user.uid);

  const userSnap =
  await getDoc(userRef);

  if(!userSnap.exists()){

    alert("Usuário não encontrado");

    location.href = "mapa.html";

    return;
  }

  const dados =
  userSnap.data();

  if(!dados.admin){

    alert("Sem permissão ADMIN");

    location.href = "mapa.html";

    return;
  }

  console.log("ADMIN LOGADO");

});
/* =========================
   BOTAO SAIR
========================= */

btnSair.onclick = ()=>{

  location.href = "mapa.html";

};