type Signal<T> = {
    (): T,
    value: T,
    _version: number,
    _valueProxy: ProxyConstructor,
};

function signal<T>(initialValue: void): Signal<T | undefined>;
function signal<T>(initialValue: T): Signal<T>;
function signal<T>(initialValue: T): Signal<T> {
    let callback = <Signal<T>>function(this: Signal<T>) {
        return this.value;
    };
    callback.value = initialValue;
    callback._version = 0;
    let callback2 = new Proxy(callback, {
        get(target, p, receiver) {
            console.log("hi");
            return Reflect.get(target, p, receiver);
        },
    });
    return callback.bind(callback2);
}


let signal1 = signal<number>(3);
console.log(signal1());

export { signal };
