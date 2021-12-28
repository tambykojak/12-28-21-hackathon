import { getRandomInt } from "../numbers"

export const getUserId = (): string | null => {
    if (typeof window === "undefined") return null

    return window.localStorage.getItem("USER_ID")
}

export const setUserId = (userId: string) => {
    if (typeof window === "undefined") return
    return window.localStorage.setItem("USER_ID", userId)
}