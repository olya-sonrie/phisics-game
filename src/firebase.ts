import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyDYyViTcx1tjHsmPFnFLi2yfNmy_MulxmM',
  authDomain: 'phisics-game.firebaseapp.com',
  databaseURL: 'https://phisics-game-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'phisics-game',
  storageBucket: 'phisics-game.firebasestorage.app',
  messagingSenderId: '1013968370363',
  appId: '1:1013968370363:web:64e127a4c259e63ff7479e',
  measurementId: 'G-YBHPK7DRGJ',
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
