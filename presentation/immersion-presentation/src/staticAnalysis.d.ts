import React from 'react';
import { CitationMap } from './Citations';
export declare type SlideInfo = {
    slide: React.ReactChild;
    info: {
        [key: string]: any;
    };
    steps: any[];
    animations: {
        start: string;
        end: string;
    }[];
    allLaTeX: string[];
    presenterNotes: React.ReactNode;
};
export declare type SlidesInfo = SlideInfo[];
export declare type SlidesInfoAndCitationMap = {
    slidesInfo: SlidesInfo;
    citationMap: CitationMap;
};
export declare function getSlidesInfo(slides: React.ReactElement[]): SlidesInfoAndCitationMap;
