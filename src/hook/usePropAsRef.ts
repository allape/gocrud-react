import { RefObject, useEffect, useRef } from "react";

export default function usePropAsRef<T = unknown>(src: T): RefObject<T> {
  const ref = useRef<T>(src);
  useEffect(() => {
    ref.current = src;
  }, [src]);
  return ref;
}
