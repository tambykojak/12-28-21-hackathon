import { Timestamp } from 'firebase/firestore'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import useCurrentUser from '../hooks/useCurrentUser'

import styles from '../styles/Index.module.css'
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
    <div className={styles.page}>
      <div className={styles.container}>
        <p className={styles.logo}>Logo goes here</p>
        <h1 className={styles.title}>TEST YOUR FRIENDSHIP</h1>
        <p className={styles.subtitle}>Prove who your real friends are</p>
        <div>
          <button onClick={onCreateNewLobbyClicked}>Create New Lobby</button>
        </div>
      </div>
    </div>
  )
}

export default Index
