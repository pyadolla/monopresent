export declare type InlineBaselineMetrics = {
    version: string;
    widthPt: number;
    advanceWidthPt?: number;
    heightPt: number;
    viewBox: [number, number, number, number];
    baselineFromTopPt: number;
    descentFromBaselinePt: number;
};
export declare type LaTeXSVGData = {
    width: number;
    height: number;
    viewBox: number[];
    inlineBaselineMetrics?: InlineBaselineMetrics;
    groups: {
        [key: string]: string;
    };
};
