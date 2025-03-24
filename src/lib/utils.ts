export const tryCatch = async <T, E = Error>(
 promise: Promise<T> | T,
): Promise<Success<T> | Failure<E>> => {
 try {
  return { data: await promise, error: null }
 } catch (e) {
  return { data: null, error: (e || true) as E }
 }
}

type Success<T> = { data: T; error: null }
type Failure<E> = { data: null; error: E }
