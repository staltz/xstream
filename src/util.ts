export function append<T> (x: T, a: T[]): T[] {
  const l = a.length
  const b = new Array(l + 1)

  for (let i = 0; i < l; ++i) {
    b[i] = a[i]
  }

  b[l] = x

  return b
}

export function remove<T> (i: number, a: T[]): T[] {
  if (i < 0) {
    throw new TypeError('i must be >= 0')
  }

  const l = a.length

  if (l === 0 || i >= l) { // exit early if index beyond end of array
    return a
  }

  if (l === 1) { // exit early if index in bounds and length === 1
    return []
  }

  return unsafeRemove<T>(i, a, l - 1)
}

function unsafeRemove<T> (i: number, a: T[], l: number): T[] {
  const b = new Array(l)
  let j: number

  for (j = 0; j < i; ++j) {
    b[j] = a[j]
  }

  for (j = i; j < l; ++j) {
    b[j] = a[j + 1]
  }

  return b
}

export function findIndex<T> (x: T, a: T[]): number {
  for (let i = 0, l = a.length; i < l; ++i) {
    if (x === a[i]) {
      return i
    }
  }
  return -1
}

export function copy<T> (a: T[]): T[] {
  const l = a.length
  const b = new Array(l)

  for (let i = 0; i < l; ++i) {
    b[i] = a[i]
  }

  return b
}

export function forEach<T> (f: (x: T, i?: number) => any, a: T[] | ArrayLike<T>): void {
  const l = a.length
  for (let i = 0; i < l; ++i) {
    f(a[i], i)
  }
}
