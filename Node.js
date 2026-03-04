import admin from "firebase-admin";

admin.initializeApp();

app.post("/gps", async (req, res) => {
  const { imei, lat, lng, vel } = req.body;

  await admin.firestore()
    .collection("localizacoes")
    .doc(imei)
    .set({
      lat: Number(lat),
      lng: Number(lng),
      velocidade: Number(vel),
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
    });

  res.send("OK");
});
