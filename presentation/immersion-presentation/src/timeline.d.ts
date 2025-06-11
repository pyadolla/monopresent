interface Timeline {
    (strings: TemplateStringsArray, ...subs: any[]): {
        [key: string]: any;
    }[];
    abbreviations: {
        [key: string]: any;
    };
}
export declare const _internalTimeline: (strings: TemplateStringsArray, ...subs: any[]) => {
    [key: string]: any;
    output: {
        [key: string]: any;
    }[];
};
export declare const timeline: Timeline;
export {};
