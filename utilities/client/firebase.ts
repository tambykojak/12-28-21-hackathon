import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { getRandomInt } from "../numbers";

const firebaseConfig = {
  apiKey: "AIzaSyD28HmFbXVMJ6QjXKEmRhS96RL1Uq9ab78",
  authDomain: "test-your-friendship.firebaseapp.com",
  projectId: "test-your-friendship",
  storageBucket: "test-your-friendship.appspot.com",
  messagingSenderId: "303973320996",
  appId: "1:303973320996:web:f2ca0d1260893723c70bb1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app)

export interface Lobby {
  id: string
}

export interface User {
  id: string
}

export const createNewLobby = async (params: Omit<Lobby, 'id'>): Promise<string> => { 
  const id = randomId()

  await setDoc(doc(db, "lobbies", id), params);

  return id
}

export const createNewUser = async (params: Omit<User, 'id'>): Promise<string> => {
  const id = randomId()

  await setDoc(doc(db, "users", id), params);

  return id 
}

export const randomId = (): string => {
  return new Date().getTime().toString() + getRandomInt(100000)
}