import { useEffect, useState } from "react"

// Types
export type ToastProps = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  duration?: number
  variant?: "default" | "destructive"
}

export type ToastActionElement = React.ReactElement

// Toast context props
export type ToastOptions = {
  title?: string
  description?: string
  action?: React.ReactNode
  duration?: number
  variant?: "default" | "destructive"
}

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000

type ToasterToast = ToastProps & {
  id: string
  title?: string
  description?: string
  duration?: number
  variant?: "default" | "destructive"
}

// Storage for toasts
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

// Initial state
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastState: State = { toasts: [] }

let listeners: Array<(state: State) => void> = []

function dispatch(action: Action) {
  toastState.toasts = reducer(toastState.toasts, action)
  listeners.forEach((listener) => {
    listener(toastState)
  })
}

function reducer(state: ToasterToast[], action: Action): ToasterToast[] {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return [action.toast, ...state].slice(0, TOAST_LIMIT)

    case actionTypes.UPDATE_TOAST:
      return state.map((t) =>
        t.id === action.toast.id ? { ...t, ...action.toast } : t
      )

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // Cancel the auto-dismiss timeout
      if (toastTimeouts.has(toastId)) {
        clearTimeout(toastTimeouts.get(toastId))
        toastTimeouts.delete(toastId)
      }

      return state.map((t) =>
        t.id === toastId ? { ...t, open: false } : t
      )
    }

    case actionTypes.REMOVE_TOAST:
      return state.filter((t) => t.id !== action.toastId)

    default:
      return state
  }
}

function useToast() {
  const [state, setState] = useState<State>(toastState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter((listener) => listener !== setState)
    }
  }, [])

  const toast = (props: ToastOptions) => {
    const id = genId()

    const update = (props: ToastOptions) =>
      dispatch({
        type: actionTypes.UPDATE_TOAST,
        toast: { ...props, id },
      })

    const dismiss = () =>
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

    dispatch({
      type: actionTypes.ADD_TOAST,
      toast: {
        ...props,
        id,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) dismiss()
        },
      },
    })

    // Auto-dismiss after duration
    if (props.duration) {
      setTimeout(dismiss, props.duration)
    }

    return {
      id,
      dismiss,
      update,
    }
  }

  return {
    ...state,
    toast,
    dismiss: (toastId: string) =>
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  }
}

export { useToast } 