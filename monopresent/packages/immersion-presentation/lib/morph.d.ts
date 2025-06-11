export declare type SVGData = {
    width: number;
    height: number;
    viewBox: number[];
};
export declare function animate(svgEl: SVGSVGElement, text: string, replaceImediately?: boolean, TIMING?: number, setSvgData?: (data: SVGData) => void): Promise<any[]>;
