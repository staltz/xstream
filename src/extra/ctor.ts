import { Stream, MemoryStream } from '../core'

export default function ctor<T> (stream: Stream<T> | MemoryStream<T>): typeof Stream {
  return stream instanceof MemoryStream ? MemoryStream : Stream
}
