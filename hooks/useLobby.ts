import { useState, useEffect } from 'react'
import { db, getLobby, Lobby } from '../utilities/client/firebase'
import { doc, onSnapshot } from "firebase/firestore";

export const useLobby = (id: string): [boolean, Lobby | null] => {
    const [loading, setLoading] = useState<boolean>(true)
    const [lobby, setLobby] = useState<Lobby | null>(null)

    useEffect(() => { 
        if (!id) return

        (async () => {
            const lobby = await getLobby(id)
            setLobby(lobby)
            setLoading(false)
        })()

        return onSnapshot(doc(db, "lobbies", id), (doc) => {
            if (doc.exists()) {
                setLobby({
                    id: doc.id,
                    ...doc.data()
                } as Lobby)
            }

            setLoading(false)
        });
    }, [id])

    return [loading, lobby]
}

export default useLobby