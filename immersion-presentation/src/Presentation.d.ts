import React from 'react';
import { SlidesInfo } from './staticAnalysis';
declare type PresentationRenderFunction = (arg: {
    slideIndex: number;
    stepIndex: number;
    slidesInfo: SlidesInfo;
    slides: React.ReactChild[];
}) => React.ReactNode;
export declare type StepAndSlide = {
    slideIndex: number;
    stepIndex: number;
    setSlideAndStep?: (slideIndex: number, stepIndex: number) => void;
};
declare type EmbedRenderFunc = (arg: {
    slideIndex: number;
    stepIndex: number;
    slidesInfo: SlidesInfo;
    presentation: React.ReactElement;
    next: (skip: boolean) => void;
    prev: (skip: boolean) => void;
}) => React.ReactElement;
export declare type PresentationProps = {
    children: React.ReactNode;
    bibUrl?: string;
    compileHost?: string;
    preamble?: string;
    embed?: boolean;
    embedOptions?: {
        stepIndex: number;
        slideIndex: number;
        render: EmbedRenderFunc;
    };
};
export declare type RenderFunc = {
    render: PresentationRenderFunction;
};
export declare type Mode = {
    mode: 'embed' | 'edit' | 'presenter' | 'fullscreen';
};
export declare function RenderPresentation({ ...props }: PresentationProps & RenderFunc): React.ReactElement;
export declare const PresentationContext: React.Context<PresentationContextInterface | null>;
export interface PresentationContextInterface {
    slideIndex: number;
    stepIndex: number;
    i: number;
    slidesInfo: SlidesInfo;
    setTransitions: (arg: any) => void;
    transition: Transition;
}
declare type Transition = {
    before?: React.CSSProperties;
    after?: React.CSSProperties;
};
export declare type Transitions = {
    [key: number]: Transition;
};
declare type SlideProps = {
    render: SlideRenderFunction;
    steps?: any[];
    children: React.ReactNode;
};
declare type SlideRenderFunction = (arg: {
    slidesInfo: SlidesInfo;
    children: React.ReactNode | ((step: any) => React.ReactNode);
    slideIndex: number;
    i: number;
    style: React.CSSProperties;
}) => React.ReactElement;
export declare function RenderSlide({ children, steps, render }: SlideProps): React.ReactElement;
export {};
