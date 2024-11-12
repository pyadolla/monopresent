import React from 'react';
import { AnimateSVGStep } from './AnimateSVG';
declare function Image({ src, styles, width, height, style, className }: {
    src: string;
    width?: string;
    height?: string;
    style?: React.CSSProperties;
    className?: string;
    styles?: AnimateSVGStep;
}): React.ReactNode;
export default Image;
