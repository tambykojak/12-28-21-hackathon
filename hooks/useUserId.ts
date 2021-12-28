import { useState, useEffect } from 'react'
import { getUserId, setUserId as writeUserIdToLocalStorage } from '../utilities/client/localStorage'
import { createNewUser } from '../utilities/client/firebase'

export const useUserId = () => {
    const [userId, setUserId] = useState<string | null>(getUserId())

    useEffect(() => { 
        if (userId !== null) return

        (async () => {
            const userId = await createNewUser({})
            writeUserIdToLocalStorage(userId)
            setUserId(userId)
        })()
    }, [userId])
    
    return userId
}

export default useUserId