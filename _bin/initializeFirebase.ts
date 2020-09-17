import firebase from 'firebase/app'
import 'firebase/auth' // If you need it
import 'firebase/database' // If you need it

export const initializeFirebase = (config: Object) => {
    if (!firebase.apps.length) {
        firebase.initializeApp(config)
        firebase.auth().signInAnonymously().catch((error) => {
            console.log("ERROR: ", error)
        })
        return {
            DB: firebase.database(),
            AUTH: firebase.auth()
        }
    }
    return {}
}