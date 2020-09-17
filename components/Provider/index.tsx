import { useRouter } from "next/router"
import { Context, useCallback, useEffect, useMemo, useState } from "react"
import { FireCTX, State } from "../.."
import { Join } from "../Join"

type Props = {
    AUTH: firebase.auth.Auth
    DB: firebase.database.Database
    init: State<{}, {}, {}>,
    DataCTX: Context<any>
    FireCTX: Context<FireCTX>
    Loading: React.FC
    classNames: {
        join?: string
    }
}

export const _provider = (props: Props): React.FC => ({ children }) => {

    const {
        AUTH,
        DB,
        init,
        DataCTX,
        FireCTX,
        Loading = () => <p>Loading...</p>,
        classNames
    } = props

    const [Ref, setRef] = useState<firebase.database.Reference>(null)
    const [listeners, setListeners] = useState([])
    const [uid, setUID] = useState<string>(null)
    const [data, setData] = useState<Props["init"]>({
        ...init,
        players: {}
    })
    const [isReady, setReady] = useState(false)
    const [isJoined, setJoined] = useState(false)
    const [owner, setOwner] = useState(null)
    const [roomName, setRoomName] = useState("")

    const router = useRouter()

    const isOwner = useMemo(() => !!owner && owner === uid, [owner, uid])

    const pushListener = useCallback((ref) => setListeners((state) => [...state, ref]), [])

    useEffect(() => {

        if (router.asPath !== router.route) {

            const [room] = Object.values(router.query)
            setRoomName(room as string)
            const Ref = DB.ref(room as string)
            const PlayersRef = Ref.child("players")
            setRef(Ref)
            pushListener(Ref)
            pushListener(PlayersRef)

            AUTH.onAuthStateChanged(user => {
                if (user) {
                    const { uid } = user
                    setUID(uid)
                    Ref.once("value", snap => {
                        const data: Props["init"] = snap.val()
                        if (!data) {
                            const initData = {
                                ...init,
                                players: null,
                                status: {
                                    ...init.status,
                                    owner: uid,
                                }
                            }
                            Ref.set(initData)
                        }
                        else if (data.players) {
                            if (Object.keys(data?.players).includes(uid)) {
                                setJoined(true)
                                Ref.child(`players/${uid}/status/isOnline`).set(true)
                            }
                        }

                        Ref.on("value", snap => {
                            const data: Props["init"] = snap.val()
                            setOwner(data.status.owner)
                            setData(data)
                            setReady(true)
                        }, err => err && console.log(err))

                    })
                }
            }, err => err && console.log("auth error: ", err))
        }

    }, [router])

    const onExit = useCallback(() => {
        listeners.forEach((ref) => ref.off())
        if (isJoined) {
            Ref.child(`players/${uid}/status/isOnline`).set(false)
        }
        if (isOwner) {
            const nextOwner = Object.entries(data.players).filter(([key, { status: { isOnline, isWaiting } }]) => key !== uid && !!isOnline && !isWaiting).map(([key]) => key)[0]
            if (nextOwner) {
                Ref.child("status/owner").set(nextOwner, (err) => console.log("owner error: ", err))
            }
            else {
                // Ref.remove()
            }
        }
        AUTH.signOut()
    }, [data.players, isOwner, Ref, uid, listeners, isJoined])

    useEffect(() => {
        window.onbeforeunload = () => {
            onExit()
        }
    }, [onExit])

    const handleJoin = useCallback((name: string) => {
        const newPlayer = { ...init.players.init }
        newPlayer.name = name
        newPlayer.status.isWaiting = !data.status.isOpen
        Ref.child(`players/${uid}`).set(newPlayer, (err) =>
            err ? console.log(err) : setJoined(true)
        )
    }, [Ref, uid, data.status.isOpen])

    const playerList = useMemo(() =>
        data.players
            ? Object.values(data.players).map(({ name }) => name)
            : []
        , [data.players])


    return !isReady ? <Loading /> : (
        <FireCTX.Provider value={{ uid, Ref, isOwner }}>
            <DataCTX.Provider value={data}>
                {!isJoined ?
                    <Join
                        handler={handleJoin}
                        playerList={playerList}
                        isOwner={isOwner}
                        className={classNames.join}
                    />
                    :
                    children
                }
            </DataCTX.Provider>
        </FireCTX.Provider>
    )
}