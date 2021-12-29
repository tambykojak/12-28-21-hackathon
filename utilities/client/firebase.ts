import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, UserCredential } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
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
export const db = getFirestore(app)
const auth = getAuth(app)

export interface Lobby {
  id: string
  hostId: string
  isGameStarted: boolean
  users: Record<string, LobbyUser>
  questions: UserQuestion[]
  questionIndex: number
}

export type LobbyUser = User & { 
  joinedLobbyAt: Timestamp, 
  ready: boolean
  score: number
  questions: UserQuestion[]
  answered: boolean
}

export interface User {
  id: string
  username: string
}

export interface UserQuestion {
  id: string
  userId: string
  question: string
  correctAnswer: string
  misleadingAnswers: string[]
}

export const createAnonymousUser = async (): Promise<UserCredential> => {
  return signInAnonymously(auth)
}

export const createNewLobby = async (params: Omit<Lobby, 'id'>): Promise<string> => { 
  console.log(`CREATE: LOBBY`)
  const id = randomId()

  await setDoc(doc(db, "lobbies", id), params);

  return id
}

export const getLobby = async (id: string): Promise<Lobby | null> => {
  console.log(`GET: LOBBY: ${id}`)
  const d = doc(db, "lobbies", id)
  const snapshot = await getDoc(d)
  if (!snapshot.exists()) return null 

  return {
    id: snapshot.id,
    ...snapshot.data()
  } as Lobby
}

export const updateLobby = async (id: string, params: Partial<Lobby>): Promise<Lobby | null> => {
  console.log(`UPDATE: LOBBY: ${id}`)
  await updateDoc(doc(db, "lobbies", id), {
    ...params
  })

  return getLobby(id)
}

export const updateLobbyUser = async (lobbyId: string, userId: string, params: Partial<LobbyUser>): Promise<void> => {
  console.info(`UPDATE: LOBBY USER: ${lobbyId}, ${userId}`)
  const userToUpdate: Record<string, any> = {}
  userToUpdate[userId] = params
  const setParams = {
    users: userToUpdate
  }
  await setDoc(doc(db, "lobbies", lobbyId), setParams, { merge: true })
}

export const createNewUser = async (id: string, params: Omit<User, 'id'>): Promise<string> => {
  console.info("CREATE: USER")
  await setDoc(doc(db, "users", id), params);

  return id 
}

export const getUser = async (id: string): Promise<User> => {
  console.log(`GET: USER: ${id}`)
  const snapshot = await getDoc(doc(db, "users", id))
  return { 
    id: snapshot.id,
    ...snapshot.data()
  } as User
}

export const updateUser = async (id: string, params: Partial<User>): Promise<User> => {
  console.log(`UPDATE: USER: ${id}`)
  await updateDoc(doc(db, "users", id), {
    ...params
  })

  return getUser(id)
}

export const randomId = (): string => {
  return new Date().getTime().toString() + getRandomInt(100000)
}