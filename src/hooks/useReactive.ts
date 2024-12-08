/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react";

const baseHandler = {
  get(target: any, key: PropertyKey) {
    const res = target[key];
    return isObject(res) ? reactive(res) : res;
  },
  set(target: any, key: PropertyKey, value: any) {
    target[key] = value;
    if (target.__notifyUpdate) {
      target.__notifyUpdate();
    }
    return true;
  },
  deleteProperty(target: any, key: PropertyKey) {
    const res = Reflect.deleteProperty(target, key);
    if (target.__notifyUpdate) {
      target.__notifyUpdate();
    }
    return res;
  },
};

function isObject(val: any): boolean {
  return typeof val === "object" && val !== null;
}

function reactive<T extends object>(target: T, notifyUpdate?: () => void): T {
  if (!isObject(target)) {
    return target;
  }
  (target as any).__notifyUpdate = notifyUpdate;
  const proxy = new Proxy(target as object, baseHandler);
  return proxy as T;
}

function useReactive<S extends object>(initialState: S): S {
  const [, forceUpdate] = useState({});
  const ref = useRef<S>();

  if (!ref.current) {
    ref.current = reactive(initialState, () => {
      forceUpdate({});
    });
  }

  return ref.current;
}

export default useReactive;
