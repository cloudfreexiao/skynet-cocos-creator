export function strfmt(fmt: string, ...args: any[]) {
    return fmt.replace(/\{(\d+)\}/g, (match: string, argIndex: number) => {
        return args[argIndex] || match;
    });
}