import { Firestore, Timestamp } from 'firebase/firestore'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import useCurrentUser from '../../hooks/useCurrentUser'
import useLobby from '../../hooks/useLobby'

import styles from '../../styles/LobbyDetail.module.css'
import { Lobby, LobbyUser, randomId, updateLobby, updateLobbyUser, updateUser, User, UserQuestion } from '../../utilities/client/firebase'
import { shuffleArray } from '../../utilities/numbers'

interface NewQuestionButtonProps {
    lobby: Lobby
    user: LobbyUser
}

const NewQuestionButton: React.FC<NewQuestionButtonProps> = ({ lobby, user }) => {
    const onCreateNewQuestionClicked = () => {
        const questions = lobby.users[user.id].questions || []

        // questions.unshift({
        //     id: randomId(),
        //     question: ``,
        //     correctAnswer: '',
        //     misleadingAnswers: [ '', '', '' ],
        //     userId: user.id
        // })

        questions.unshift({
            id: randomId(),
            question: randomId(),
            correctAnswer: randomId(),
            misleadingAnswers: [ randomId(), randomId(), randomId() ],
            userId: user.id
        })        

        updateLobbyUser(lobby.id, user.id, {
            questions
        })
    }

    return (
        <div style={{ height: "120px", borderStyle: 'dashed', padding: "8px" }}>
            <button disabled={lobby.users[user.id].ready} onClick={onCreateNewQuestionClicked}>Create a new question</button>
        </div>     
    )
}

interface QuestionListItemProps {
    lobby: Lobby,
    user: LobbyUser,
    question: UserQuestion
    onRemoveClicked: () => void
    onEditQuestion: (params: UserQuestion) => void
}

const QuestionListItem: React.FC<QuestionListItemProps> = ({ lobby, user, question, onEditQuestion, onRemoveClicked }) => {
    const [questionText, setQuestionText] = useState<string>(question.question)
    const [correctAnswer, setCorrectAnswer] = useState<string>(question.correctAnswer)
    const [misleadingAnswer1, setMisleadingAnswer1] = useState<string>(question.misleadingAnswers[0])
    const [misleadingAnswer2, setMisleadingAnswer2] = useState<string>(question.misleadingAnswers[1])
    const [misleadingAnswer3, setMisleadingAnswer3] = useState<string>(question.misleadingAnswers[2])

    useEffect(() => {
        const timeout = setTimeout(() => {
            onEditQuestion({
                id: question.id,
                userId: user.id,
                question: questionText,
                correctAnswer: correctAnswer,
                misleadingAnswers: [misleadingAnswer1, misleadingAnswer2, misleadingAnswer3]
            })
        }, 1000)

        return () => {
            clearTimeout(timeout)
        }
    }, [questionText, correctAnswer, misleadingAnswer1, misleadingAnswer2, misleadingAnswer3])

    return (
        <div style={{ padding: '16px', minHeight: "120px", borderStyle: 'solid', marginTop: "16px"}}>
            <input style={{ width: '100%',}} disabled={lobby.users[user.id].ready} value={questionText} placeholder='Your question here' onChange={(e) => setQuestionText(e.target.value)}/>
            <div style={{display: 'flex', flexDirection: 'column'}}>
                <p style={{ marginTop: '8px'}}>What is the correct answer? <input disabled={lobby.users[user.id].ready} value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}/></p>
                <p style={{ marginTop: '8px'}}>What are three misleading answers?</p>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <input disabled={lobby.users[user.id].ready} className={styles.misleadingInput} value={misleadingAnswer1} onChange={(e) => setMisleadingAnswer1(e.target.value)} />
                    <input disabled={lobby.users[user.id].ready} style={{ marginLeft: "8px", marginRight: "8px" }} className={styles.misleadingInput} value={misleadingAnswer2} onChange={(e) => setMisleadingAnswer2(e.target.value)}/>
                    <input disabled={lobby.users[user.id].ready} className={styles.misleadingInput} value={misleadingAnswer3} onChange={(e) => setMisleadingAnswer3(e.target.value)}/>
                </div>
            </div>

            <div style={{ display: 'flex', marginTop: "8px" }}>
                <div style={{ flexGrow: 1 }}></div>
                <button disabled={lobby.users[user.id].ready} onClick={onRemoveClicked}>Remove</button>
            </div>
        </div>
    )
}

interface QuestionsListProps {
    lobby: Lobby
    user: LobbyUser
}

const QuestionsList: React.FC<QuestionsListProps> = ({ lobby, user}) => {
    const onEditQuestion = (newParams: UserQuestion) => {
        const indexToEdit = lobby.users[user.id].questions.findIndex((v) => v.id === newParams.id)
        lobby.users[user.id].questions[indexToEdit] = newParams
        updateLobbyUser(lobby.id, user.id, {
            questions: lobby.users[user.id].questions
        })
    }

    const onRemoveQuestion = (question: UserQuestion) => {
        const indexToRemove = lobby.users[user.id].questions.findIndex((v) => v.id === question.id)
        lobby.users[user.id].questions.splice(indexToRemove, 1)

        updateLobbyUser(lobby.id, user.id, { 
            questions: lobby.users[user.id].questions
        })
    }

    return (
        <div style={{ minHeight: '0px', flex: 1, overflowY: 'scroll', marginTop: "16px", padding: "16px", borderStyle: "solid" }}>
            <NewQuestionButton lobby={lobby} user={user}/>         
            {(lobby.users[user.id].questions || []).map((q) => (
                <QuestionListItem
                    lobby={lobby}
                    user={user}
                    key={q.id}
                    question={q}
                    onEditQuestion={(params) => onEditQuestion(params)}
                    onRemoveClicked={() => onRemoveQuestion(q)}
                />
            ))}      
        </div>
    )
}

interface QuestionsPanelProps {
    lobby: Lobby
    user: LobbyUser
}

const MIN_QUESTIONS = 2
const QuestionsPanel: React.FC<QuestionsPanelProps> = ({ lobby, user }) => {
    const onReadyButtonClicked = async () => {
        await updateLobbyUser(lobby.id, user.id, { ready: !user.ready })
    }

    const questionLength = lobby.users[user.id].questions.length
    
    const canReadyUp = () => {
        const questions = lobby.users[user.id].questions

        if (questions.length < MIN_QUESTIONS) return false

        for (let i = 0; i < questions.length; i ++) {
            const v = [questions[i].correctAnswer, questions[i].question, ...questions[i].misleadingAnswers]
            if (v.includes("")) return false
        }

        return true
    }

    const canStartGame = () => {
        const users = Object.values(lobby.users)
        
        for (let i = 0; i < users.length; i ++) {
            if (!users[i].ready) return false
        }

        return true
    }

    const isHost = () => { 
        return lobby.hostId === user.id
    }

    const prepareQuestions = (): UserQuestion[] =>{ 
        const questions: any[] = []
        const randomizedUsers: LobbyUser[] = shuffleArray(Object.values(lobby.users))
        
        randomizedUsers.map((u) => u.questions.map((q) => ({ ...q, userId: u.id }))).forEach((qa) => { 
            questions.push(...shuffleArray(qa).slice(0, MIN_QUESTIONS))
        })

        return questions
    }

    const onStartGameClicked = () => {
        console.log('start game')
        updateLobby(lobby.id, {
            isGameStarted: true,
            questions: prepareQuestions()
        })
    }

    return (
        <div style={{ backgroundColor: 'white', flex: '1', minHeight: '65%', maxHeight: '65%', marginTop: '32px', padding: '8px', display: 'flex', flexDirection: 'column'}}>
            <div style={{ flex: '0 0 50px' }}>
                <p style={{ fontSize: "18px", fontWeight: "bold"}}>Your question bank</p>
                <p style={{ fontSize: "14px"}}>The questions you create below will be asked to your friends in this lobby to test how well they know you. You will probably want to cater the questions to the group that you are playing with.</p>
            </div>
            <QuestionsList 
                lobby={lobby}
                user={lobby.users[user.id]}
            />
            <div style={{ flex: '0 0 50px', display: 'flex', padding: '8px', alignItems: 'center' }}>
                <p style={{ fontSize: '12px', flexGrow: '1' }}>You have {questionLength} question{questionLength === 1 ? '' : 's'} in your question bank. You need at least {MIN_QUESTIONS} to start.</p>
                <button disabled={!canReadyUp()} onClick={onReadyButtonClicked}>{user.ready ? "Unready" : "Ready Up"}</button>
                {isHost() && <button disabled={!canStartGame()} style={{ marginLeft: '8px'}} onClick={onStartGameClicked}>Start Game</button>}
            </div>
        </div>
    )
}

interface ParticipantsPanelProps {
    user: User
    lobby: Lobby
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ user, lobby }) => {
    const sortedUserIds = () => {
        return Object.keys(lobby.users).sort((a, b): number => {
            return lobby.users[a].joinedLobbyAt.toDate().getTime() - lobby.users[b].joinedLobbyAt.toDate().getTime()
        })
    }

    return (
        <div className={styles.participantsContainer}>
            <h2>Friends in Lobby</h2>
            {sortedUserIds().map((userId) => {
                let preUsernameLabel = "[Not Ready]"

                if (lobby.users[userId].ready) preUsernameLabel = "[Ready]";

                let postUsernameLabel = ""
                
                if (userId === user.id) postUsernameLabel += " (You)"
                if (userId === lobby.hostId) postUsernameLabel += " (Host)"

                return (
                    <p key={userId}>{preUsernameLabel} {lobby.users[userId].username}{postUsernameLabel}</p>
                )
            })}
        </div>    
    )    
}

interface UsernamePanelProps { 
    lobby: Lobby,
    user: User
}

const UsernamePanel: React.FC<UsernamePanelProps> = ({ lobby, user }) => { 
    const [usernameInput, setUsernameInput] = useState(user?.username || '')
    const [errorMessage, setErrorText] = useState('')

    useEffect(() => {
        if (usernameInput === undefined) return

        setErrorText('')
        const timeout = setTimeout(() => onUsernameChanged(usernameInput), 500)

        return () => {
            if (!timeout) return
            clearTimeout(timeout)
        }
    }, [usernameInput])
    
    const onUsernameChanged = (newUsername: string) => {
        if (!user || !lobby) return

        const error = isUsernameValid(newUsername)
        if (error) {
            setErrorText(error)
            return
        }

        (() => {
            updateUser(user.id, {
                username: newUsername
            })

            updateLobbyUser(lobby.id, user.id, { username: newUsername })
        })()
    }

    const isUsernameValid = (newUsername: string): string | null => {
        if (newUsername.length === 0) {
            return "Your name cannot be blank."
        }

        if (newUsername.length < 5) {
            return "Your name must be at least 5 characters."
        }

        if (newUsername.length > 20) {
            return `Your name can't be more than 20 characters. ${newUsername.length - 20} character(s) too many!`
        }

        return null
    }

    return (
        <div className={styles.yourUsernameContainer}>
            <p className={styles.yourUsernamePrompt}>Update your username here. Use your real first name for fun easter eggs.</p>
            <input disabled={lobby.users[user.id].ready} className={styles.yourUsernameInput} type="text" defaultValue={user.username} onChange={(e) => setUsernameInput(e.target.value)}/>
            <p className={styles.yourUsernameError}>{errorMessage}</p>
        </div>
    )
}

interface LobbyUrlPanelProps {

}

const LobbyUrlPanel: React.FC<LobbyUrlPanelProps> = ({}) => {
    const onCopyLinkClicked = () => {
        navigator.clipboard.writeText(window.location.toString())
    }    

    return (
        <div className={styles.lobbyUrlContainer}>
            <p className={styles.lobbyUrlPrompt}>Share the link below with your friends!</p>
            <div style={{ display: 'flex' }}>
                <input readOnly className={styles.lobbyUrlInput} type="text" value={window.location.toString()}/>
                <button style={{ flex: 1 }} onClick={onCopyLinkClicked}>Copy Link</button>
            </div>
        </div>        
    )
}

const LobbyDetail: NextPage = () => {
    const router = useRouter()
    const [isUserLoading, user] = useCurrentUser()
    const [isLobbyLoading, lobby] = useLobby(router.query.id as string)

    useEffect(() => {
        if (!lobby || !user) return

        if (lobby.isGameStarted) {
            router.replace(`/lobbies/${lobby.id}/play`)
        }
    }, [lobby?.isGameStarted])

    useEffect(() => {
        if (!lobby || !user) return

        if (lobby.isGameStarted) {
            if (Object.keys(lobby.users).includes(user.id)) {
                router.replace(`/lobbies/${lobby.id}/play`)
            } else {
                router.replace(`/`)
            }
        }

        if (!Object.keys(lobby.users).includes(user.id)) {
            console.log(`Current user ${user.username} is not part of the displayed lobby. Adding them...`)
            const users: Record<string, LobbyUser> = {}
            users[user.id] = {
                answered: false, 
                ...user,
                ready: false,
                joinedLobbyAt: Timestamp.now(),
                questions: [],
                score: 0
            }
            
            console.log('use effect')
            updateLobby(lobby.id, {
                users
            })
        }
    }, [user, lobby])

    if (isLobbyLoading || isUserLoading) return <div>Loading...</div>

    if (!user || !lobby || !lobby.users[user.id]) {
        return <div>Loading...</div>
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <ParticipantsPanel 
                    user={user}
                    lobby={lobby}
                />
                <div className={styles.rightSideContainer}>
                    <UsernamePanel 
                        lobby={lobby}
                        user={user}
                    />
                    <QuestionsPanel lobby={lobby} user={lobby.users[user.id]} />
                    <LobbyUrlPanel />
                </div>
            </div>
        </div>
    )
}

export default LobbyDetail
