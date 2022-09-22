export type MethodKeys<T> = {
    // lint rules don't like us to use 'Function' as a type,
    // but we "know what we are doing" here. Really 😀
    // eslint-disable-next-line @typescript-eslint/ban-types
    [P in keyof T]: T[P] extends Function ? P : never;
}[keyof T];

// Map input type to new type, excluding keys with function value
export type NoMethods<T> = Omit<T, MethodKeys<T>>;
