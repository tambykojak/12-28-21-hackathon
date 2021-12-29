import { useState, useEffect } from 'react'
import randomNameGenerator from 'random-username-generator'
import { getUserId, setUserId as writeUserIdToLocalStorage } from '../utilities/client/localStorage'
import { createAnonymousUser, createNewUser, getUser, User } from '../utilities/client/firebase'

export const useCurrentUser = (): [boolean, User | null] => {
    const [loading, setLoading] = useState<boolean>(true)
    const [userId, setUserId] = useState<string | null>(getUserId())
    const [user, setUser] = useState<User | null>(null)
    

    useEffect(() => { 
        if (userId !== null) return

        (async () => {
            console.log("Local user id not found. Creating anonymous user...")
            const userCredential = await createAnonymousUser()
            
            randomNameGenerator.setSeperator(" ")
            const userId = await createNewUser(userCredential.user.uid, { username: randomNameGenerator.generate()})
            writeUserIdToLocalStorage(userId)
            setUserId(userId)
        })()
    }, [])

    useEffect(() =>{ 
        if (userId === null) return

        (async () => {
            const user = await getUser(userId)
            setUser(user)
            setLoading(false)
        })()
    }, [userId])
    
    return [loading, user]
}

export default useCurrentUser