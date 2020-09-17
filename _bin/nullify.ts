export const nullify = <T>(obj: T) =>
    Object.keys(obj).reduce((prev, key) => ({
        ...prev,
        [key]: () => null
    }), {} as T)