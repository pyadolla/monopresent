import React from 'react';
export declare function InlineMath({ children, ...props }: {
    children: string;
    [key: string]: any;
}): React.ReactElement;
export declare function DisplayMath({ children, ...props }: {
    children: string;
    [key: string]: any;
}): React.ReactElement;
export declare const m: (template: TemplateStringsArray, ...subtitutions: any[]) => React.ReactElement;
export declare const M: (template: TemplateStringsArray, ...subtitutions: any[]) => React.ReactElement;
