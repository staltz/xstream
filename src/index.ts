export function Stream(subscribe: () => void) {
    this.subscribe = subscribe;
}
