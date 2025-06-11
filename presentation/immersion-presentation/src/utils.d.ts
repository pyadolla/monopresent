import { useEffect } from 'react';
export declare const range: (n: number) => number[];
export declare const hashString: (str: string) => number;
export declare const LaTeX: {
    _preamble: string;
    _host: string;
    getHost: () => string;
    setHost: (h: string) => void;
    getPreamble: () => string;
    setPreamble: (p: string) => void;
    fetchSVG: (tex: string) => Promise<string>;
};
export declare const fetchLaTeXSvg: any;
export declare function usePrevious<T>(value: T): T | undefined;
export declare function useLocalStorage<T>(key: string, initialValue: T): readonly [T, (value: T | ((t: T) => T)) => void];
export declare const isBrowser: boolean;
export declare const useIsomorphicLayoutEffect: typeof useEffect;
