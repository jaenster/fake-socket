import {Duplex} from "stream";
import {AddressInfo,  Socket, SocketConnectOpts} from "net";


type NoReadonly<T> = { -readonly [P in keyof T]: T[P] };

const otherSym = Symbol('other');
export class FakeSocket extends Duplex implements Socket {
    public readonly [otherSym]: FakeSocket;

    static createPair(): [FakeSocket, FakeSocket] {
        const one = new FakeSocket();
        const two = new FakeSocket();

        (one as NoReadonly<FakeSocket>)[otherSym] = two;
        (two as NoReadonly<FakeSocket>)[otherSym] = one;

        return [one, two];
    }

    readonly bufferSize: number = 0;
    readonly bytesRead: number = 0;
    readonly bytesWritten: number = 0;
    readonly connecting: boolean;
    readonly localAddress: string;
    readonly localPort: number;

    address(): AddressInfo | string {
        return 'fake-socket';
    }

    connect(options: SocketConnectOpts, connectionListener?: () => void): this;
    connect(port: number, host: string, connectionListener?: () => void): this;
    connect(port: number, connectionListener?: () => void): this;
    connect(path: string, connectionListener?: () => void): this;
    connect(...args: any[]): this {
        args.filter(e => typeof e === 'function').forEach(setTimeout);
        console.log('Faking socket');
        return this;
    }

    write(chunk: any, encoding?: string, cb?: (error: Error | null | undefined) => void): boolean;
    write(chunk: any, cb?: (error: Error | null | undefined) => void): boolean;
    write(...args: any[]): boolean {
        args.filter(e => typeof e === 'function').filter(e => setTimeout(() => e(undefined)));
        let chunk: any = args[0];
        if (typeof chunk === 'string') chunk = chunk.split('').map(el => el.charCodeAt(0)); // if string, convert to array of numbers
        if (typeof chunk === 'number') chunk = [chunk]; // if number, convert to array of numbers
        if (!(chunk instanceof Buffer)) chunk = Buffer.from(chunk);

        const other = this[otherSym] as NoReadonly<FakeSocket>;

        other.bufferSize += chunk.length;
        other.emit('data', chunk);
        other.bytesRead += chunk.length;
        other.bufferSize -= chunk.length;

        (this as NoReadonly<FakeSocket>).bytesWritten += chunk.length;

        return true;
    }

    // ToDo; implement these properly

    ref(): this {
        return undefined;
    }

    setKeepAlive(enable?: boolean, initialDelay?: number): this {
        return undefined;
    }

    setNoDelay(noDelay?: boolean): this {
        return undefined;
    }

    setTimeout(timeout: number, callback?: () => void): this {
        return undefined;
    }

    unref(): this {
        return undefined;
    }

    _read(...args: any[]) {
        // required to implement / override
    }

    _write(...args: any[]) {
        // required to implement / override
    }

}