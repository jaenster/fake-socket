import {Duplex} from "stream";
import {AddressInfo,  Socket, SocketConnectOpts} from "net";
import {FiFo} from "@jaenster/queues";


type NoReadonly<T> = { -readonly [P in keyof T]: T[P] };

const otherSym = Symbol('other');
const notifySym = Symbol('notify');
const fakeSockSym = Symbol('fakeSock');
export class FakeSocket extends Duplex implements Socket {

    // Data object with custom values
    [fakeSockSym] = {
        queue: new FiFo<Buffer>(FakeSocket.prototype[notifySym].bind(this)),
        timeoutCount: 0,
    };

    [notifySym](this: NoReadonly<FakeSocket>) {
        const {queue} = this[fakeSockSym];
        const buffers = (queue as any).q.slice((queue as any).i) as Buffer[];

        // set the buffersize
        this.bufferSize = buffers.reduce((acc,cur) => (acc|0)+(cur.length|0),0);

        if (++this[fakeSockSym].timeoutCount === 1) {
            // Next tick, fire all events
            setTimeout(() => {
                for(const buffer of queue) {
                    this.emit('data', buffer);
                    this.bytesRead += buffer.length;
                    this.bufferSize -= buffer.length;
                }
                this[fakeSockSym].timeoutCount = 0;
            })
        }
    }


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

        this[otherSym][fakeSockSym].queue.add(chunk);
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