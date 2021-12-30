import { Firestore, increment } from 'firebase/firestore'
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

const PlayerCard: React.FC<LobbyUserProps & { player: LobbyUser }> = ({ lobby, player }) => {
    const status = player.answered ? "[Answered]" : '[Waiting]'
    return <div style={{ padding: "8px", borderStyle: 'solid', marginBottom: '16px', display: 'flex' }}>
        <div style={{ fontSize: '10px', alignSelf: 'center', marginRight: '4px', fontWeight: 'bold'}}>{status}</div>
        <div style={{ flexGrow: 1 }}>{player.username}</div>
        <div>{player.score || 0}</div>
    </div>
} 

const PlayersList: React.FC<LobbyUserProps> = ({ lobby }) => {
    return (
        <div style={{ margin: '16px' }}>
            <h1>Players</h1>
            {Object.keys(lobby.users).sort(((a, b) => lobby.users[b].score - lobby.users[a].score)).map((id) => {
                return <PlayerCard key={id} player={lobby.users[id]} lobby={lobby} />
            })}
        </div>
    )
}

const Play: NextPage = () => {
    const router = useRouter()
    const { id: lobbyId } = router.query
    const [isLobbyLoading, lobby] = useLobby(lobbyId as string)
    const [isUserLoading, user] = useCurrentUser()
    const [currentQuestion, setCurrentQuestion] = useState<UserQuestion | null>(null)
    const [currentAnswers, setCurrentAnswers] = useState<string[]>([])
    const [globalCountDown, setGlobalCountDown] = useState<number>(5)
    const [currentQuestionAnswered, setCurrentQuestionAnswered] = useState<boolean>(false)
    const [lastAnswer, setLastAnswer] = useState<string>('')
    
    useEffect(() => {
        if (!lobby) return

        if (!lobby.isGameStarted) {
            router.replace('/')
        }

        if (allPlayersAnswered()) {
            if (lobby.questionIndex >= lobby.questions.length) {
                router.replace(`/lobbies/${lobby.id}/leaderboard`)
                return
            }

            setGlobalCountDown(5)
        }
    }, [lobby])

    const allPlayersAnswered = (): boolean => {
        if (!lobby) return false
        return !Object.values(lobby?.users).map((u) => u.answered).includes(false)
    }

    const clearAnsweredStatus = async () => {
        if (!lobby) return
        const users: Record<string, Partial<LobbyUser>> = {}
        Object.keys(lobby.users).forEach((userId) => {
            users[userId] = {}
            users[userId].answered = false
        })

        await updateLobby(lobby.id, {
            users: users as Record<string, LobbyUser>
        })
    }

    const nextQuestion = () => {
        if (!lobby) return
        (() => {
            clearAnsweredStatus()

            if (lobby.questionIndex >= lobby.questions.length) {
                router.replace(`/lobbies/${lobby.id}/leaderboard`)
                return
                // TEMPORARY FOR DEV
                // lobby.questionIndex = 0
            }
    
            const nextQuestion = lobby.questions[lobby.questionIndex]
            setCurrentQuestion(nextQuestion)
            setCurrentAnswers(shuffleArray([nextQuestion.correctAnswer, ...nextQuestion.misleadingAnswers]))
            updateLobby(lobby.id, {
                questionIndex: lobby.questionIndex + 1
            })
        }
        )()
    }

    useEffect(() => {
        if (globalCountDown > 0) setTimeout(() => setGlobalCountDown(globalCountDown - 1), 1000)

        if (globalCountDown === 0) nextQuestion()
    }, [globalCountDown])

    const onAnswerClicked = (index: number) => {
        if (!lobby || !user) return
        const users: Record<string, any > = {}
        users[user.id] = {}
        const selectedAnswer = currentAnswers[index]
        setLastAnswer(selectedAnswer)
        
        if (selectedAnswer === currentQuestion?.correctAnswer) {
            users[user.id].score = increment(20)
        }

        users[user.id].answered = true
        updateLobby(lobby.id, {
            users: users as Record<string, LobbyUser>
        })

        setCurrentQuestionAnswered(true)
    }

    if (isLobbyLoading || !lobby || !user) return <div style={{ }}></div>

    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
            <div style={{ backgroundColor: 'white', flex: 1, height: '100%' }}>
                <PlayersList lobby={lobby} />
            </div>
            <div style={{ flex: 3, flexDirection: 'column', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {globalCountDown ? <div style={{fontSize: '100px', backgroundColor: 'white', borderColor: 'black', boxShadow: '0px 2px 5px 0px', borderRadius: '125px', minWidth: '250px', minHeight: '250px', justifySelf: 'center', textAlign: 'center', alignItems: 'center', justifyContent: 'center', display: 'flex'}}>{globalCountDown}</div> : <Fragment/>}
                {globalCountDown === 0 && currentQuestion ? (
                    <div style={{backgroundColor: 'white', margin: '16px', padding: '16px', borderRadius: '12px'}}>
                        <h4 style={{textAlign: 'center'}}>A question from {lobby.users[currentQuestion.userId].username}.</h4>
                        <h2 style={{textAlign: 'center'}}>{currentQuestion.question}</h2>
                        <div style={{ display: 'flex' }}>
                            <button disabled={lobby.users[user.id].answered} onClick={() => onAnswerClicked(0)} style={{margin: "16px", minWidth: '200px',minHeight: '32px', flex: 1}}>{currentAnswers[0]}</button>
                            <button disabled={lobby.users[user.id].answered} onClick={() => onAnswerClicked(1)} style={{margin: "16px", minWidth: '200px',minHeight: '32px', flex: 1}}>{currentAnswers[1]}</button>
                        </div>
                        <div style={{ display: 'flex'}}>
                            <button disabled={lobby.users[user.id].answered} onClick={() => onAnswerClicked(2)} style={{margin: "16px", minWidth: '200px', minHeight: '32px', flex: 1}}>{currentAnswers[2]}</button>
                            <button disabled={lobby.users[user.id].answered} onClick={() => onAnswerClicked(3)} style={{margin: "16px", minWidth: '200px',minHeight: '32px', flex: 1}}>{currentAnswers[3]}</button>                            
                        </div>
                    </div>
                ): <Fragment />}
                {currentQuestion && lobby.users[user.id].answered ? (<div style={{ marginTop: '16px', backgroundColor: 'white', padding: '8px', borderRadius: '8px', boxShadow: '0px 2px 10px 0px'}}>
                    { lastAnswer === currentQuestion?.correctAnswer ? 
                    (<div>You were correct! +20 points.</div>) : 
                    (<div>You were incorrect, the right answer was {currentQuestion?.correctAnswer}.</div>)
                        
                    }
                </div>) : <Fragment/>}
            </div>
        </div>
    )
}

export default Play