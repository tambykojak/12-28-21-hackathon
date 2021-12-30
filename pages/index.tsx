import { Timestamp } from 'firebase/firestore'
import type { NextPage } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import useCurrentUser from '../hooks/useCurrentUser'
import friendsImage from '../public/friends.png'

import { createNewLobby, LobbyUser, User } from '../utilities/client/firebase'

const Index: NextPage = () => {
  const router = useRouter()
  const [isCurrentUserLoading, user] = useCurrentUser()

  const onCreateNewLobbyClicked = () => {
    if (!user) return

    (async () => {
      const users: Record<string, LobbyUser> = {}
      users[user.id] = { answered: false, ...user, score: 0, joinedLobbyAt: Timestamp.now(), ready: false, questions: [] }
      const lobbyId = await createNewLobby({ questions: [], questionIndex: 0, isGameStarted: false, hostId: user.id, users })
      router.push(`/lobbies/${lobbyId}`)
    })()
  }

  return (
    <div style={{ display: "flex", height: "100vh", alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ display: 'flex', height: '350px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'white', borderRadius: '16px' }}>
        <div style={{width: '150px'}}><Image layout='intrinsic' src={friendsImage} /></div>
        <h1 style={{ margin: "0px", padding: "0px", fontSize: '40px' }} >TEST YOUR FRIENDSHIP</h1>
        <p style={{ fontStyle: 'italic' }}>prove who your real friends are</p>
        <div style={{marginTop: '32px'}}>
          <button onClick={onCreateNewLobbyClicked}>Create New Lobby</button>
        </div>
      </div>
    </div>
  )
}

export default Index
