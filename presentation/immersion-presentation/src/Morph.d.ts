import React from 'react';
export declare const wrapMathBasedOnProps: (props: {
    display?: boolean;
    inline?: boolean;
}, s: string) => string;
declare type MorphProps = {
    children: string;
    display?: boolean;
    inline?: boolean;
    debug?: boolean;
    useAnimationDatabase?: boolean;
    replace?: boolean;
    TIMING?: number;
    style?: React.CSSProperties;
    className?: string;
};
declare function Morph({ children, display, inline, debug, useAnimationDatabase, replace, TIMING, style, className }: MorphProps): React.ReactElement;
export default Morph;
