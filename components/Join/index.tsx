import { useCallback, useState } from "react"
import styles from "./styles.module.scss"

type Props = {
    handler: (name: string) => void
    playerList: string[]
    isOwner: boolean
    className: string
}

export const Join: React.FC<Props> = (props) => {

    const {
        handler,
        playerList,
        isOwner,
        className
    } = props

    const [name, setName] = useState("")
    const [error, setError] = useState("")

    const onClick = useCallback(() => {
        if (!name) return setError("need a name dummy")
        const players = playerList.filter((p) => !!p).map((p) => p.toLowerCase())
        if (players.includes(name.toLowerCase())) {
            setName("")
            return setError("name's taken")
        }
        handler(name)
    }, [playerList, handler, name])

    return (
        <div className={className || styles.join}>
            <section>
                <h1>PLAYERS</h1>
                <ul>
                    {
                        playerList.map((p, i) =>
                            <li key={i}>{p}{i < playerList.length - 1 && ", "}</li>
                        )
                    }
                </ul>
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        onClick()
                    }}
                >

                    <input
                        type="text"
                        placeholder={error || "Enter Name"}
                        value={name} onChange={(e) => {
                            setError("")
                            setName(e.target.value)
                        }} />
                    <button type="submit">
                        {isOwner ? "Create" : "Join"} Room
                </button>
                </form>
            </section>
        </div>
    )

}