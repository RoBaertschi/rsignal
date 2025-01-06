interface ReadonlySignal<T> {
    (): T,
    readonly value: T,
    _version: number,
};

type ComputeFunc<T, R> = (input: T) => R;

type ComputedSignal<T, P> = ReadonlySignal<T> & {
    value: T,
    _parent: ReadonlySignal<P>,
    _func: ComputeFunc<P, T>,
    _version: number,
    _value: T, // fake, only for typescript, this gets translated to value on assigns.
}

interface Signal<T> {
    (): T,
    value: T,
    _version: number,
};

function signal<T>(initialValue: void): Signal<T | undefined>;
function signal<T>(initialValue: T): Signal<T>;
function signal<T>(initialValue: T): Signal<T> {
    let callback = <Signal<T>>function() {
        return callback.value;
    };
    callback.value = initialValue;
    callback._version = 0;
    let proxiedCallback = new Proxy(callback, {
        get(target, p, receiver) {
            return Reflect.get(target, p, receiver);
        },
        set(target, p, newValue, receiver) {
            if (p === "value") {
                if (target[p] !== newValue) {
                    target._version += 1;
                }
            }

            return Reflect.set(target, p, newValue, receiver);
        },
    });
    return proxiedCallback;
}

function computed<T, R>(signal: ReadonlySignal<T>, func: (input: T) => R): ReadonlySignal<R> {
    let proxiedCallback: ComputedSignal<R, T>;
    let callback = <ComputedSignal<R, T>>function() {
        if (signal._version !== proxiedCallback._version) {
            proxiedCallback._value = proxiedCallback._func(signal.value);
            proxiedCallback._version = signal._version;
        }
        return callback.value;
    }
    callback._parent = signal;
    callback._func = func;
    callback._version = -1;
    proxiedCallback = new Proxy(callback, {
        get(target, p, receiver) {
            if (p === "value") {
                return target();
            }
            return Reflect.get(target, p, receiver);
        },
        set(target, p, newValue, receiver) {
            if (p === "value") {
                throw Error("Cannot assign value to a ReadonlySignal");
            } else if (p === "_value") {
                return Reflect.set(target, "value", newValue, receiver);
            }

            return Reflect.set(target, p, newValue, receiver);
        },
    });
    return proxiedCallback;
}

let test = signal(1);
let testComputed = computed(test, value => {
    console.log("ran");
    return value * 2;
});
let testComputed2 = computed(testComputed, value => {
    console.log("ran2");
    return value * 2;
});
test.value += 1;
test.value += 1;
test.value += 1;
test.value += 1;
console.log(test(), testComputed(), testComputed2());

export { signal };
