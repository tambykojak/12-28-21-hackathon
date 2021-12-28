import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import useUserId from '../hooks/useUserId'

import styles from '../styles/Index.module.css'
import { createNewLobby } from '../utilities/client/firebase'

const Index: NextPage = () => {
  const router = useRouter()
  const userId = useUserId()

  const onCreateNewLobbyClicked = () => {
    const createLobby = async () => {
      const lobbyId = await createNewLobby({})
      router.push(`/lobby/${lobbyId}`)
    }

    createLobby()
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <p className={styles.logo}>Logo goes here</p>
        <h1 className={styles.title}>TEST YOUR FRIENDSHIP</h1>
        <p className={styles.subtitle}>Prove who your real friends are</p>
        <div>
          <input type="text" placeholder="Input Game Code"/>
          <button>Join Game</button>
        </div>
        <div>
          <button onClick={onCreateNewLobbyClicked}>Create New Lobby</button>
        </div>
      </div>
    </div>
  )
}

export default Index
