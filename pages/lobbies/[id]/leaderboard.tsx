import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useState } from 'react'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useLobby from '../../../hooks/useLobby'
import { Lobby, LobbyUser, updateLobby, UserQuestion } from '../../../utilities/client/firebase'
import { shuffleArray } from '../../../utilities/numbers'

interface LobbyUserProps {
    lobby: Lobby
}

const PlayerCard: React.FC<LobbyUserProps & { player: LobbyUser, i: number }> = ({ lobby, player, i }) => {
    let status = '1st'

    switch (i) {
        case 0:
            status = '1st'
            break;
        case 1:
            status = '2nd'
            break;
        case 2:
            status = '3rd'
            break;
        case 3:
            status = '4th'
            break;
        default:
            status = `${i + 1}th`
            break;                       
    }

    return <div style={{ padding: "8px", borderStyle: 'solid', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '20px', alignSelf: 'center'}}>{status}</div>
        <div style={{ flexGrow: 1, marginLeft: '20px' }}>{player.username}</div>
        <div>{player.score || 0}</div>
    </div>
} 

const PlayersList: React.FC<LobbyUserProps> = ({ lobby }) => { 
    return (
        <div style={{ flexGrow: 1, margin: '16px' }}>
            <h1>Players</h1>
            {Object.keys(lobby.users).sort(((a, b) => lobby.users[b].score - lobby.users[a].score)).map((id, i) => {
                return <PlayerCard key={id} player={lobby.users[id]} lobby={lobby} i={i} />
            })}
        </div>
    )
}

const Play: NextPage = () => {
    const router = useRouter()
    const { id: lobbyId } = router.query
    const [isLobbyLoading, lobby] = useLobby(lobbyId as string)
    const [_, user] = useCurrentUser()
    
    if (isLobbyLoading || !lobby || !user) return <div style={{ backgroundColor: "#4ea8d5" }}></div>

    const onNewLobbyClicked = () => {
        router.replace('/')
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#4ea8d5', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white', height: '50%', width: '50%'}}>
                <PlayersList lobby={lobby} />
                <div style={{alignItems: 'center', justifyContent: 'center', display: 'flex', backgroundColor: 'green', padding: '24px'}}>
                    <button onClick={onNewLobbyClicked} style={{ padding: '24px'}}>Main Menu</button>
                </div>
            </div>
        </div>
    )
}

export default Play