import React from 'react';
export declare type CitationMap = {
    [key: string]: number;
};
declare type Bibliography = {
    label: string;
}[];
export interface CitationContextInterface {
    citationMap: CitationMap;
    bibliography: Bibliography | null;
}
export declare const CitationContext: React.Context<CitationContextInterface | null>;
declare type CitationProviderProps = {
    bibUrl?: string;
    citationMap: CitationMap;
    children: React.ReactNode;
};
export declare function CitationProvider({ bibUrl, citationMap, children }: CitationProviderProps): React.ReactElement;
declare type CiteRenderFunction = (arg: {
    text: string | null;
    number: string | number | null;
}) => React.ReactElement;
declare type RenderCiteProps = {
    id: string;
    render: CiteRenderFunction;
};
declare type BibliographyRenderFunction = (items: {
    id: string;
    n: number;
    html: string;
}[]) => React.ReactElement;
export declare function RenderCite({ id, render }: RenderCiteProps): React.ReactElement;
export declare function RenderBibliography({ render }: {
    render: BibliographyRenderFunction;
}): React.ReactElement;
export {};
