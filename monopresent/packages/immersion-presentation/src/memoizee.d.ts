declare module 'memoizee' {
  type MemoizeeOptions = {
    primitive?: boolean;
    normalizer?: (...args: any[]) => any;
    maxAge?: number;
    max?: number;
    promise?: boolean | 'then' | 'done' | 'done:finally';
    length?: number;
    async?: boolean;
    profileName?: string;
    dispose?: (...args: any[]) => void;
    resolvers?: Array<(...args: any[]) => any>;
    [key: string]: any;
  };

  function memoize<F extends (...args: any[]) => any>(
    fn: F,
    options?: MemoizeeOptions
  ): F;

  export = memoize;
}
