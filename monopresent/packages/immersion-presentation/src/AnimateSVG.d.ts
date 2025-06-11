import React from 'react';
export declare type AnimateSVGStep = {
    css?: React.CSSProperties;
    [key: string]: any;
};
declare type AnimateSVGProps = {
    src: string;
    step: AnimateSVGStep;
    width: string | number;
    height: string | number;
    style: React.CSSProperties;
    className: string;
};
declare function AnimateSVG({ src, step, width, height, style, className }: AnimateSVGProps): React.ReactElement;
export default AnimateSVG;
